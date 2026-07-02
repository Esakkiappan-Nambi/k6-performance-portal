

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "10s", target: 5 },   // ramp-up
        { duration: "20s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── Login API Request ──
        let res_0 = http.request(
            "POST",
            `https://reqres.in/api/login`,
            JSON.stringify({
  "email": "eve.holt@reqres.in",
  "password": "cityslicka"
}),
            { headers: {
  "Content-Type": "application/json",
  "x-api-key": "reqres_13adb9008546419d9a83a2e935031afa"
} }
        );

        console.log("Request: Login API Request");
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

        try {
            variables.token = res_0.json("token");
            console.log("Extracted token:", variables.token);
        } catch (err) {
            console.log("Extraction failed for token:", err);
        }

        check(res_0, {
            "status 200": (r) => r.status === 200,
            "response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        // ── Get User Request ──
        let res_1 = http.get(`https://reqres.in/api/users/2`, {
            headers: {
  "Authorization": `Bearer ${variables.token}`,
  "x-api-key": "reqres_13adb9008546419d9a83a2e935031afa"
}
        });

        console.log("Request: Get User Request");
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
            "status 200": (r) => r.status === 200,
            "response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
