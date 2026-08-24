from sqlalchemy import Column, Integer, String,Text,DateTime,ForeignKey,TIMESTAMP,Float,Boolean
from datetime import datetime
from database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from fastapi import UploadFile, File, Form
import uuid
import os

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    confirm_password = Column(String)

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)

    test_name = Column(String, nullable=False)

    users = Column(Integer, nullable=False)

    duration = Column(Integer, nullable=False)

    # NEW
    ramp_up = Column(Integer, default=0)

    loop_count = Column(Integer, default=1)

    scenario = Column(Text, nullable=False)

    script_path = Column(String)

    status = Column(String, default="Created")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    assertions = Column(Text, nullable=True)
    
    csv_enabled = Column(Boolean, default=False)
    csv_path = Column(String, nullable=True)
    csv_variables = Column(String, nullable=True)
    cookie_enabled = Column(Boolean, default=False)
    cookie_clear_each_iteration = Column(Boolean, default=False)
    cookie_policy = Column(String, default="strict")
    cache_enabled              = Column(Boolean, default=False)
    cache_clear_each_iteration = Column(Boolean, default=False)
    cache_max_size             = Column(Integer, default=75)
    udv_enabled = Column(Boolean, default=False)
    user_defined_variables = Column(Text, nullable=True)
    schedule_enabled = Column(Boolean, default=False)
    schedule         = Column(Text, nullable=True)   # stores JSON string
    user_id = Column(Integer, ForeignKey("users.id"))
    
class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)

    test_id = Column(Integer,ForeignKey("tests.id"))

    status = Column(String,default="Running")

    output = Column(Text)

    started_at = Column(TIMESTAMP,server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)

    execution_id = Column(Integer, ForeignKey("test_runs.id", ondelete="CASCADE"))

    avg_response_time = Column(Float, default=0)
    requests_per_second = Column(Float, default=0)
    error_rate = Column(Float, default=0)

    p90 = Column(Float, default=0)
    p95 = Column(Float, default=0)

    passed_checks = Column(Float, default=0)
    total_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    min_response_time = Column(Float, default=0)
    max_response_time = Column(Float, default=0)
    failed_checks = Column(Integer, default=0)
    output = Column(Text)
    report_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

