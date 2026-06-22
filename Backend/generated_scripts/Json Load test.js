

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "10s", target: 5 },   // ramp-up
        { duration: "15s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── Create Post ──
        let res_0 = http.request(
            "POST",
            `https://jsonplaceholder.typicode.com/posts`,
            JSON.stringify({
  "title": "Load Test Post",
  "body": "Created during k6 test",
  "userId": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Create Post");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1000 / 1000);

        check(res_0, {
            "Create Post status 201": (r) => r.status === 201,
            "Create Post response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Get All posts ──
        let res_1 = http.get(`https://jsonplaceholder.typicode.com/posts?Limit=${encodeURIComponent(`_limit=5`)}&Page=${encodeURIComponent(`_page=1`)}`, {
            headers: {}
        });

        console.log("Request: Get All posts");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1000 / 1000);

        check(res_1, {
            "Get All posts status 200": (r) => r.status === 200,
            "Get All posts response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        // ── Get Single Post ──
        let res_2 = http.get(`https://jsonplaceholder.typicode.com/posts/1`, {
            headers: {}
        });

        console.log("Request: Get Single Post");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(500 / 1000);

        try {
            variables.postId = res_2.json("id");
            console.log("Extracted postId:", variables.postId);
        } catch (err) {
            console.log("Extraction failed for postId:", err);
        }

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
