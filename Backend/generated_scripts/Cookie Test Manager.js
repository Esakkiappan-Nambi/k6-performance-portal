import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "2s", target: 2 },
        { duration: "10s", target: 2 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    
    
    const variables = {};
    const jar = http.cookieJar(); // HTTP Cookie Manager

    
    

    for (let i = 0; i < 1; i++) {
        
        // Cache disabled - no caching applied
        

        // ── Login  Request ──
        let res_0 = http.request(
            "POST",
            `https://dummyjson.com/auth/login`,
            JSON.stringify({
"username": "emilys",
"password": "emilyspass"
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Login  Request");
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

        // ── Cookie Test With Manager ──
        let res_1 = http.get(`https://dummyjson.com/auth/me`, {
            headers: {}
        });

        console.log("Request: Cookie Test With Manager");
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

    }
}
