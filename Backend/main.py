from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session
from csv_handler import save_csv
from database import (SessionLocal, engine, Base)
from fastapi import Depends
from auth import get_current_user
import re
from models import User, Test, TestRun, Report
from schemas import (RegisterUser, LoginUser)
import json
from auth import (hash_password, verify_password, create_access_token)
from fastapi.middleware.cors import CORSMiddleware
from schemas import TestCreate
import os
import uuid
from fastapi import Form, File, UploadFile, BackgroundTasks
import json
from k6_runner import (generate_k6_script, execute_k6, generate_pdf_report)

Base.metadata.create_all(bind=engine)

app = FastAPI()

import re


def convert_to_ms(value):
    if "ms" in value:
        return float(value.replace("ms", ""))
    elif "s" in value:
        return float(value.replace("s", "")) * 1000
    return float(value)


import json


def extract_metrics(summary_data, output, summary_path=None):

    if not summary_data and summary_path:
        with open(summary_path, "r", encoding="utf-8") as f:
            summary_data = json.load(f)

    metrics = summary_data.get("metrics", {})

    http_reqs = metrics.get("http_reqs", {})
    duration = metrics.get("http_req_duration", {})
    checks = metrics.get("checks", {})
    failed = metrics.get("http_req_failed", {})

    return {
        "total_requests": http_reqs.get("count", 0),
        "throughput": http_reqs.get("rate", 0),
        "avg_response_time": duration.get("avg", 0),
        "min_response_time": duration.get("min", 0),
        "max_response_time": duration.get("max", 0),
        "p90": duration.get("p(90)", 0),
        "p95": duration.get("p(95)", 0),
        "failed_requests": checks.get("fails", 0),
        "passed_checks": checks.get("passes", 0),
        "error_rate": failed.get("value", 0) * 100
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        confirm_password=hash_password(user.confirm_password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@app.post("/login")
def login_user(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "full_name": db_user.full_name,
        "email": db_user.email
    }


@app.post("/create-test")
def create_test(
    test_name: str = Form(...),
    users: int = Form(...),
    duration: int = Form(...),
    ramp_up: int = Form(...),
    loop_count: int = Form(...),
    scenario: str = Form(...),
    assertions: str = Form(None),
    enable_csv: bool = Form(False),
    variable_name: str = Form(None),
    csv_file: UploadFile = File(None),
    enable_cookie_manager: bool = Form(False),
    cookie_config: str = Form(None),
    # ✅ NEW cache params
    enable_cache_manager: bool = Form(False),
    cache_config: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csv_path = None
    scenario_data = json.loads(scenario)
 
    assertions_data = None
    if assertions:
        assertions_data = json.loads(assertions)
 
    # Cookie config
    cookie_clear_each_iteration = False
    if enable_cookie_manager and cookie_config:
        parsed_cookie = json.loads(cookie_config)
        cookie_clear_each_iteration = parsed_cookie.get("clearEachIteration", False)
 
    # ✅ Cache config
    cache_clear_each_iteration = False
    cache_max_size = 75
    if enable_cache_manager and cache_config:
        parsed_cache = json.loads(cache_config)
        cache_clear_each_iteration = parsed_cache.get("clearEachIteration", False)
        cache_max_size = int(parsed_cache.get("maxSize", 75))
 
    # Validate scenario steps
    for step in scenario_data:
        if not step.get("url"):
            raise HTTPException(status_code=400, detail=f"URL missing in step: {step.get('name')}")
        step["thinkTime"] = int(step.get("thinkTime") or 0)
        step["headers"] = step.get("headers") or "{}"
        step["body"] = step.get("body") or "{}"
 
        raw_params = step.get("params") or []
        step["params"] = [
            {"id": p.get("id"), "name": p.get("name", "").strip(), "value": p.get("value", ""), "enabled": p.get("enabled", True)}
            for p in raw_params if p.get("name", "").strip()
        ]
 
        if step.get("extractVariable"):
            if not step.get("variableName"):
                raise HTTPException(status_code=400, detail=f"variableName missing in step: {step.get('name')}")
            if not step.get("jsonPath"):
                raise HTTPException(status_code=400, detail=f"jsonPath missing in step: {step.get('name')}")
 
        if step.get("assertions", {}).get("enabled"):
            step_assertions = step.get("assertions", {})
            for field in ["status_code", "max_response_time", "max_error_rate"]:
                if field not in step_assertions:
                    raise HTTPException(status_code=400, detail=f"{field} missing in step: {step.get('name')}")
 
    if enable_csv:
        if not csv_file:
            raise HTTPException(status_code=400, detail="CSV file is required")
        csv_path = save_csv(csv_file)
 
    script_path = generate_k6_script(
        test_name=test_name, users=users, duration=duration, ramp_up=ramp_up,
        loop_count=loop_count, scenario=scenario_data, assertions=assertions_data,
        csv_enabled=enable_csv, csv_path=csv_path, csv_variables=variable_name,
        cookie_enabled=enable_cookie_manager,
        cookie_clear_each_iteration=cookie_clear_each_iteration,
        # ✅ pass cache params
        cache_enabled=enable_cache_manager,
        cache_clear_each_iteration=cache_clear_each_iteration,
        cache_max_size=cache_max_size,
    )
 
    new_test = Test(
        test_name=test_name, users=users, duration=duration, ramp_up=ramp_up,
        loop_count=loop_count, scenario=json.dumps(scenario_data),
        script_path=script_path, status="Created", assertions=None,
        csv_enabled=enable_csv, csv_path=csv_path, csv_variables=variable_name,
        cookie_enabled=enable_cookie_manager,
        cookie_clear_each_iteration=cookie_clear_each_iteration,
        # ✅ save cache fields
        cache_enabled=enable_cache_manager,
        cache_clear_each_iteration=cache_clear_each_iteration,
        cache_max_size=cache_max_size,
        user_id=current_user.id
    )
 
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
 
    return {"message": "Test Created Successfully", "test_id": new_test.id}

# ✅ FIXED: background task opens its OWN DB session — not shared with request
def run_k6_in_background(test_id: int, test_run_id: int, script_path: str, assertions_raw):
    # Open a brand-new session independent of the HTTP request lifecycle
    db = SessionLocal()

    try:
        print(f"[k6] Starting test_id={test_id} run_id={test_run_id}")

        output, summary_data, summary_path = execute_k6(script_path, test_run_id)

        print(f"[k6] k6 finished. summary_data keys: {list(summary_data.get('metrics', {}).keys())[:5]}")

        metrics = extract_metrics(summary_data, output, summary_path)

        # Re-fetch test name for PDF
        test = db.query(Test).filter(Test.id == test_id).first()
        test_name = test.test_name if test else "Unknown"

        pdf_report_path = generate_pdf_report(test_run_id, test_name, metrics, output)

        # ── Parse assertions ──────────────────────────────────────────────────
        if assertions_raw:
            assertions = json.loads(assertions_raw) if isinstance(assertions_raw, str) else assertions_raw
        else:
            # Default — won't mark as failed just because assertions weren't set
            assertions = {"status_code": 200, "max_response_time": 99999, "max_error_rate": 100}

        # ── Decide final status ───────────────────────────────────────────────
        status = "completed"

        if not summary_data:
            status = "failed"
        elif metrics["avg_response_time"] > assertions["max_response_time"]:
            status = "failed"
        elif metrics["error_rate"] > assertions["max_error_rate"]:
            status = "failed"

        print(f"[k6] Final status: {status}")

        # ── Save report ───────────────────────────────────────────────────────
        report = Report(
            execution_id=test_run_id,
            avg_response_time=metrics["avg_response_time"],
            min_response_time=metrics["min_response_time"],
            max_response_time=metrics["max_response_time"],
            requests_per_second=metrics["throughput"],
            total_requests=metrics["total_requests"],
            failed_requests=metrics["failed_requests"],
            passed_checks=metrics["passed_checks"],
            error_rate=metrics["error_rate"],
            p90=metrics["p90"],
            p95=metrics["p95"],
            output=output,
            report_path=pdf_report_path,
        )
        db.add(report)

        # ── Update test + run status ──────────────────────────────────────────
        test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
        if test:
            test.status = status
        if test_run:
            test_run.status = status
            test_run.output = output

        db.commit()
        print(f"[k6] DB updated. run_id={test_run_id} status={status}")

    except Exception as e:
        print(f"[k6] Exception: {e}")
        # Rollback any partial writes, then mark as failed in a clean transaction
        try:
            db.rollback()
            test = db.query(Test).filter(Test.id == test_id).first()
            test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
            if test:
                test.status = "failed"
            if test_run:
                test_run.status = "failed"
                test_run.output = str(e)
            db.commit()
            print(f"[k6] Marked run_id={test_run_id} as failed")
        except Exception as inner_e:
            print(f"[k6] Could not mark as failed: {inner_e}")

    finally:
        # ✅ Always close the session we opened
        db.close()


@app.post("/run-test/{test_id}")
def run_test(
    test_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = db.query(Test).filter(Test.id == test_id).first()

    if not test:
        raise HTTPException(status_code=404, detail="Test Not Found")

    # ── Validate script exists before queuing ─────────────────────────────────
    if not test.script_path or not os.path.exists(test.script_path):
        raise HTTPException(status_code=400, detail="Test script not found. Please re-save the test.")

    test.status = "running"

    test_run = TestRun(
        test_id=test.id,
        user_id=current_user.id,
        status="running",
        output="",
    )
    db.add(test_run)
    db.commit()
    db.refresh(test_run)

    # ✅ Pass only plain values (not the db session) to the background task
    background_tasks.add_task(
        run_k6_in_background,
        test_id=test.id,
        test_run_id=test_run.id,
        script_path=test.script_path,
        assertions_raw=test.assertions,   # plain string — safe to pass
    )

    return {
        "run_id": test_run.id,
        "test_id": test.id,
        "status": "running",
        "message": "Test started. Poll /report/{run_id} for status.",
    }


@app.get("/test-runs")
def get_test_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    runs = db.query(TestRun).join(Test, Test.id == TestRun.test_id).filter(
        Test.user_id == current_user.id).order_by(TestRun.id.desc()).all()

    result = []
    for run in runs:
        test = db.query(Test).filter(Test.id == run.test_id).first()
        result.append({
            "id": run.id,
            "test_id": run.test_id,
            "test_name": test.test_name if test else "Unknown",
            "status": run.status,
            "started_at": run.started_at
        })

    return result


@app.get("/tests")
def get_tests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tests = db.query(Test).filter(Test.user_id == current_user.id).all()

    result = []
    for test in tests:
        latest_run = (
            db.query(TestRun)
            .filter(TestRun.test_id == test.id)
            .order_by(TestRun.id.desc())
            .first()
        )
        result.append({
            "id": test.id,
            "test_name": test.test_name,
            "users": test.users,
            "duration": test.duration,
            "status": latest_run.status if latest_run else "Not Run",
            "created_at": test.created_at
        })

    return result


@app.get("/report/{run_id}")
def get_report(run_id: int, db: Session = Depends(get_db)):
    run = db.query(TestRun).filter(TestRun.id == run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    test = db.query(Test).filter(Test.id == run.test_id).first()
    report = db.query(Report).filter(Report.execution_id == run.id).first()

    if not report:
        return {
            "id": run.id,
            "test_name": test.test_name if test else "Unknown",
            "status": run.status,
            "started_at": run.started_at,
            "throughput": 0, "avg_response_time": 0, "min_response_time": 0,
            "max_response_time": 0, "p90": 0, "p95": 0, "error_rate": 0,
            "total_requests": 0, "failed_requests": 0, "passed_checks": 0,
            "output": run.output or ""
        }

    return {
        "id": run.id,
        "test_name": test.test_name if test else "Unknown",
        "status": run.status,
        "started_at": run.started_at,
        "throughput": round(report.requests_per_second, 2),
        "avg_response_time": round(report.avg_response_time, 2),
        "min_response_time": round(report.min_response_time or 0, 2),
        "max_response_time": round(report.max_response_time or 0, 2),
        "p90": round(report.p90, 2),
        "p95": round(report.p95, 2),
        "error_rate": round(report.error_rate, 2),
        "total_requests": report.total_requests,
        "failed_requests": report.failed_requests,
        "passed_checks": report.passed_checks,
        "output": report.output
    }


@app.get("/dashboard-stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_tests = db.query(Test).filter(Test.user_id == current_user.id).count()

    total_runs = (
        db.query(TestRun)
        .join(Test, Test.id == TestRun.test_id)
        .filter(Test.user_id == current_user.id)
        .distinct(TestRun.id)
        .count()
    )

    successful_runs = (
        db.query(TestRun)
        .join(Test, Test.id == TestRun.test_id)
        .filter(Test.user_id == current_user.id)
        .filter(TestRun.status == "completed")
        .count()
    )

    failed_runs = (
        db.query(TestRun)
        .join(Test, Test.id == TestRun.test_id)
        .filter(Test.user_id == current_user.id)
        .filter(TestRun.status == "failed")
        .count()
    )

    running_runs = (
        db.query(TestRun)
        .join(Test, Test.id == TestRun.test_id)
        .filter(Test.user_id == current_user.id)
        .filter(TestRun.status == "running")
        .count()
    )

    success_rate = 0
    if total_runs > 0:
        success_rate = round((successful_runs / total_runs) * 100, 2)

    return {
        "total_tests": total_tests,
        "total_runs": total_runs,
        "success_rate": success_rate,
        "running_runs": running_runs,
        "failed_runs": failed_runs
    }


@app.get("/recent-tests")
def recent_tests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tests = (
        db.query(Test)
        .filter(Test.user_id == current_user.id)
        .order_by(Test.id.desc())
        .limit(5)
        .all()
    )
    return tests


@app.get("/reports")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    runs = (
        db.query(TestRun)
        .join(Test, Test.id == TestRun.test_id)
        .filter(Test.user_id == current_user.id)
        .order_by(TestRun.id.desc())
        .all()
    )

    result = []
    for run in runs:
        test = db.query(Test).filter(Test.id == run.test_id).first()
        result.append({
            "id": run.id,
            "test_name": test.test_name if test else "Unknown",
            "status": run.status,
            "started_at": run.created_at
        })

    return result


@app.get("/execution-chart")
def execution_chart(db: Session = Depends(get_db)):
    runs = db.query(TestRun).order_by(TestRun.id).all()

    completed = 0
    failed = 0
    data = []

    for run in runs:
        if run.status == "completed":
            completed += 1
        elif run.status == "failed":
            failed += 1
        data.append({"run_id": run.id, "completed": completed, "failed": failed})

    return data


import os
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

SCRIPT_FOLDER = "generated_scripts"


@app.delete("/delete-test/{test_id}")
def delete_test(test_id: int, db: Session = Depends(get_db)):
    # Find the test
    test = db.query(Test).filter(Test.id == test_id).first()

    if not test:
        raise HTTPException(
            status_code=404,
            detail="Test not found"
        )

    # Script path (assuming script name = test_name.js)
    script_path = os.path.join(
        SCRIPT_FOLDER,
        f"{test.test_name}.js"
    )

    # Delete test config from DB
    db.delete(test)
    db.commit()

    # Delete generated script if exists
    if os.path.exists(script_path):
        os.remove(script_path)

    return {
        "message": "Test deleted successfully",
        "script_deleted": os.path.exists(script_path) is False
    }


@app.get("/test/{test_id}")
def get_test_by_id(
    test_id: int,
    db: Session = Depends(get_db)
):
    test = db.query(Test).filter(Test.id == test_id).first()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    return {
        "id": test.id,
        "test_name": test.test_name,
        "users": test.users,
        "duration": test.duration,
        "ramp_up": test.ramp_up,
        "loop_count": test.loop_count,
        "scenario": test.scenario,
        "assertions": test.assertions,
        "csv_enabled": test.csv_enabled,
        "csv_variables": test.csv_variables,
        "cookie_enabled": test.cookie_enabled,
        "cookie_clear_each_iteration": test.cookie_clear_each_iteration,
    }


@app.put("/update-test/{test_id}")
def update_test(
    test_id: int,
    test_name: str = Form(...),
    users: int = Form(...),
    duration: int = Form(...),
    ramp_up: int = Form(...),
    loop_count: int = Form(...),
    scenario: str = Form(...),
    assertions: str = Form(None),
    enable_csv: bool = Form(False),
    variable_name: str = Form(None),
    csv_file: UploadFile = File(None),
    enable_cookie_manager: bool = Form(False),
    cookie_config: str = Form(None),
    # ✅ NEW cache params
    enable_cache_manager: bool = Form(False),
    cache_config: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
 
    try:
        parsed_scenario = json.loads(scenario)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scenario JSON")
 
    for step in parsed_scenario:
        if not step.get("url"):
            raise HTTPException(status_code=400, detail=f"URL missing in step: {step.get('name')}")
        step["thinkTime"] = int(step.get("thinkTime") or 0)
        step["headers"] = step.get("headers") or "{}"
        step["body"] = step.get("body") or "{}"
 
        raw_params = step.get("params") or []
        step["params"] = [
            {"id": p.get("id"), "name": p.get("name", "").strip(), "value": p.get("value", ""), "enabled": p.get("enabled", True)}
            for p in raw_params if p.get("name", "").strip()
        ]
 
        if step.get("extractVariable"):
            if not step.get("variableName"):
                raise HTTPException(status_code=400, detail=f"variableName missing in step: {step.get('name')}")
            if not step.get("jsonPath"):
                raise HTTPException(status_code=400, detail=f"jsonPath missing in step: {step.get('name')}")
 
        if step.get("assertions", {}).get("enabled"):
            step_assertions = step.get("assertions", {})
            for field in ["status_code", "max_response_time", "max_error_rate"]:
                if field not in step_assertions:
                    raise HTTPException(status_code=400, detail=f"{field} missing in step: {step.get('name')}")
 
    parsed_assertions = None
    if assertions:
        try:
            parsed_assertions = json.loads(assertions)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid assertions JSON")
 
    cookie_clear_each_iteration = False
    if enable_cookie_manager and cookie_config:
        try:
            parsed_cookie = json.loads(cookie_config)
            cookie_clear_each_iteration = parsed_cookie.get("clearEachIteration", False)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cookie_config JSON")
 
    # ✅ Parse cache config
    cache_clear_each_iteration = False
    cache_max_size = 75
    if enable_cache_manager and cache_config:
        try:
            parsed_cache = json.loads(cache_config)
            cache_clear_each_iteration = parsed_cache.get("clearEachIteration", False)
            cache_max_size = int(parsed_cache.get("maxSize", 75))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cache_config JSON")
 
    if enable_csv and csv_file and csv_file.filename:
        upload_folder = "uploads"
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, csv_file.filename)
        with open(file_path, "wb") as f:
            f.write(csv_file.file.read())
        test.csv_path = file_path
 
    test.test_name = test_name
    test.users = users
    test.duration = duration
    test.ramp_up = ramp_up
    test.loop_count = loop_count
    test.scenario = json.dumps(parsed_scenario)
    test.assertions = json.dumps(parsed_assertions) if parsed_assertions else None
    test.csv_enabled = enable_csv
    test.csv_variables = variable_name if variable_name else test.csv_variables
    test.cookie_enabled = enable_cookie_manager
    test.cookie_clear_each_iteration = cookie_clear_each_iteration
    # ✅ update cache fields
    test.cache_enabled = enable_cache_manager
    test.cache_clear_each_iteration = cache_clear_each_iteration
    test.cache_max_size = cache_max_size
 
    script_path = generate_k6_script(
        test_name=test.test_name, users=test.users, duration=test.duration,
        ramp_up=test.ramp_up, loop_count=test.loop_count, scenario=parsed_scenario,
        assertions=parsed_assertions, csv_enabled=test.csv_enabled, csv_path=test.csv_path,
        csv_variables=test.csv_variables, cookie_enabled=enable_cookie_manager,
        cookie_clear_each_iteration=cookie_clear_each_iteration,
        # ✅ pass cache params
        cache_enabled=enable_cache_manager,
        cache_clear_each_iteration=cache_clear_each_iteration,
        cache_max_size=cache_max_size,
    )
 
    test.script_path = script_path
    db.commit()
    db.refresh(test)
 
    return {"message": "Test updated successfully", "test_id": test.id}


@app.delete("/delete-run/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(TestRun).filter(TestRun.id == run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    db.delete(run)
    db.commit()

    return {"message": "Run deleted successfully"}


from fastapi.responses import FileResponse


@app.get("/download-report/{run_id}")
def download_report(run_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.execution_id == run_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not os.path.exists(report.report_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=report.report_path,
        media_type="application/pdf",
        filename=f"run_{run_id}_report.pdf"
    )
    
    
from fastapi import Depends

@app.get("/verify-token")
def verify_token(current_user: User = Depends(get_current_user)):
    return {
        "valid": True,
        "user": current_user.email
    }