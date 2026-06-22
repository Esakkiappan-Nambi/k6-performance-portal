

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "10s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── Get Posts-body check ──
        let res_0 = http.get(`https://jsonplaceholder.typicode.com/posts/1`, {
            headers: {}
        });

        console.log("Request: Get Posts-body check");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(500 / 1000);

        check(res_0, {
            "Get Posts-body check status 200": (r) => r.status === 200,
            "Get Posts-body check response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        check(res_0, {
            "Get Posts-body check — body contains 'userId'": (r) => (r.body || "").includes("userId"),
            "Get Posts-body check — body contains 'title'": (r) => (r.body || "").includes("title"),
            "Get Posts-body check — body not_contains 'error'": (r) => !(r.body || "").includes("error")
        });

        // ── Get User-Status Text Check ──
        let res_1 = http.get(`https://jsonplaceholder.typicode.com/users/1`, {
            headers: {}
        });

        console.log("Request: Get User-Status Text Check");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(500 / 1000);

        check(res_1, {
            "Get User-Status Text Check status 200": (r) => r.status === 200,
            "Get User-Status Text Check response time < 2998ms": (r) => r.timings.duration <= 2998
        });

        check(res_1, {
            "Get User-Status Text Check — body contains 'Leanne Graham'": (r) => (r.body || "").includes("Leanne Graham"),
            "Get User-Status Text Check — status_text equals 'OK'": (r) => (r.status_text || "") === "OK"
        });

        // ── Create Post - Body Check ──
        let res_2 = http.request(
            "POST",
            `https://jsonplaceholder.typicode.com/posts`,
            JSON.stringify({
  "title": "Test Post",
  "body": "Hello from k6",
  "userId": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Create Post - Body Check");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1000 / 1000);

        check(res_2, {
            "Create Post - Body Check status 200": (r) => r.status === 200,
            "Create Post - Body Check response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        check(res_2, {
            "Create Post - Body Check — body contains 'Test Post'": (r) => (r.body || "").includes("Test Post"),
            "Create Post - Body Check — body contains 'id'": (r) => (r.body || "").includes("id"),
            "Create Post - Body Check — body not_contains 'error'": (r) => !(r.body || "").includes("error")
        });

        // ── Get Comments - Headers Check ──
        let res_3 = http.get(`https://jsonplaceholder.typicode.com/comments/1`, {
            headers: {}
        });

        console.log("Request: Get Comments - Headers Check");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(500 / 1000);

        check(res_3, {
            "Get Comments - Headers Check status 200": (r) => r.status === 200,
            "Get Comments - Headers Check response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        check(res_3, {
            "Get Comments - Headers Check — body contains 'application/json'": (r) => (r.body || "").includes("application/json"),
            "Get Comments - Headers Check — body matches_regex '\d+'": (r) => new RegExp("\d+").test(r.body || "")
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
