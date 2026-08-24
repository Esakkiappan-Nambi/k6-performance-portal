import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    
    
    const variables = {};
    

    
    

    for (let i = 0; i < 2; i++) {
        
        
        

        // ── Request 1 ──
        let res_0 = http.get(`https://jsonplaceholder.typicode.com/users`, {
            headers: {
  "Accept": "application/json"
}
        });

        console.log("Request: Request 1");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── Create Post Request ──
        let res_1 = http.request(
            "POST",
            `https://jsonplaceholder.typicode.com/posts`,
            JSON.stringify({
"title": "k6 Testing",
"body": "Performance test data",
"userId": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Create Post Request");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(998 / 1000);

        check(res_1, {
            "Create Post Request status 200": (r) => r.status === 200,
            "Create Post Request response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        check(res_1, {
            "Create Post Request — body contains '\"k6 Testing\"'": (r) => (r.body || "").includes("\"k6 Testing\"")
        });

    }
}
