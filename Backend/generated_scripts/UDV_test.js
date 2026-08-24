

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "15s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {
    baseUrl: `https://jsonplaceholder.typicode.com`,
    userId: `1`
};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── User defined Get test ──
        let res_0 = http.get(`${variables.baseUrl}/users/${variables.userId}`, {
            headers: {
  "Content-type": "application/json"
}
        });

        console.log("Request: User defined Get test");
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
            "User defined Get test status 200": (r) => r.status === 200,
            "User defined Get test response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
