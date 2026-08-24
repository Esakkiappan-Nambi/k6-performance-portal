

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "10s", target: 10 },   // ramp-up
        { duration: "20s", target: 10 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {
    baseUrl: `https://dummyjson.com`
};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── Login API ──
        let res_0 = http.request(
            "POST",
            `${variables.baseUrl}/auth/login`,
            JSON.stringify({
"username": "emilys",
"password": "emilyspass"
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Login API");
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

        try {
            variables.authToken = res_0.json("accessToken");
            console.log("Extracted authToken:", variables.authToken);
        } catch (err) {
            console.log("Extraction failed for authToken:", err);
        }

        check(res_0, {
            "Login API status 200": (r) => r.status === 200,
            "Login API response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        // ── Get Profile Request  ──
        let res_1 = http.get(`${variables.baseUrl}/auth/me`, {
            headers: {
  "Authorization": `Bearer ${variables.authToken}`
}
        });

        console.log("Request: Get Profile Request ");
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
            "Get Profile Request  status 200": (r) => r.status === 200,
            "Get Profile Request  response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
