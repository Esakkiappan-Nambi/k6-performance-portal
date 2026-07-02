

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

        // ── Login Request  ──
        let res_0 = http.request(
            "POST",
            `https://jsonplaceholder.typicode.com/posts`,
            JSON.stringify({
  "title": "foo",
  "body": "bar",
  "userId": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Login Request ");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        try {
            variables.id = res_0.json("id");
            console.log("Extracted id:", variables.id);
        } catch (err) {
            console.log("Extraction failed for id:", err);
        }

        check(res_0, {
            "Login Request  status 200": (r) => r.status === 200,
            "Login Request  response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        // ── Get Request ──
        let res_1 = http.get(`https://jsonplaceholder.typicode.com/posts/1`, {
            headers: {
  "Authorization": `Bearer ${variables.id}`
}
        });

        console.log("Request: Get Request");
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
            "Get Request status 200": (r) => r.status === 200,
            "Get Request response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
