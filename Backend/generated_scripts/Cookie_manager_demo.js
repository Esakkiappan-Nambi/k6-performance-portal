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
    

    
    

    for (let i = 0; i < 2; i++) {
        
    // Clear cookies (JMeter: clear each iteration)
            jar.clear("https://auth.example.com");
        jar.clear("https://partner.example.com");
    
        
        

        // ── Login ──
        let res_0 = http.request(
        "POST",
        `https://auth.example.com/login`,
        JSON.stringify({
"username": "demo",
"password": "secret"
}),
        { headers: {
  "Content-Type": "application/json"
}, jar: jar, }
    );

        console.log("Request: Login");
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

        // ── Request 2 ──
        let res_1 = http.get(`https://auth.example.com/dashboard`, {
            headers: {},
            jar: jar,
        });

        console.log("Request: Request 2");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(999 / 1000);

        // ── Call Partner API ──
        let res_2 = http.get(`https://partner.example.com/data`, {
            headers: {},
            jar: jar,
        });

        console.log("Request: Call Partner API");
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

    }
}
