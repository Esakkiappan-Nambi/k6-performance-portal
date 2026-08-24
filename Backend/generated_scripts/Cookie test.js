import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");




export const options = {
    stages: [
        { duration: "5s", target: 5 },
        { duration: "10s", target: 5 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    const variables = {};
    
    const jar = http.cookieJar(); // HTTP Cookie Manager
    

    
    

    for (let i = 0; i < 1; i++) {
        
    // Clear cookies (JMeter: clear each iteration)
            jar.clear("https://dummyjson.com");
    
        
        

        // ── Login Request  ──
        let res_0 = http.request(
        "POST",
        `https://dummyjson.com/auth/login`,
        JSON.stringify({
"username": "emilys",
"password": "emilyspass",
"expiresInMins": 1
}),
        { headers: {
  "Content-Type": "application/json"
}, jar: jar, }
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

        // Extract variable: token
        try {
            variables.token = res_0.json("accessToken");
            console.log("Extracted token =", variables.token);
        } catch (e) {
            console.warn("Failed to extract token from path accessToken:", e.message);
        }

        check(res_0, {
            "status 200": (r) => r.status === 200,
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Get Profile Request  ──
        let res_1 = http.get(`https://dummyjson.com/auth/me`, {
            headers: {
  "Authorization": `Bearer ${variables.token}`
},
            jar: jar,
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

        check(res_1, {
            "status 200": (r) => r.status === 200,
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Refresh token Request ──
        let res_2 = http.request(
        "POST",
        `https://dummyjson.com/auth/refresh`,
        JSON.stringify({
"refreshToken": "${variables.token}",
"expiresInMins": 1
}),
        { headers: {
  "Content-Type": "application/json"
}, jar: jar, }
    );

        console.log("Request: Refresh token Request");
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
            "status 200": (r) => r.status === 200,
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

    }
}
