import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");




export const options = {
    stages: [
        { duration: "10s", target: 20 },
        { duration: "25s", target: 20 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    const variables = {};
    

    
    

    for (let i = 0; i < 1; i++) {
        
        
        

        // ── Computers data ──
        let res_0 = http.get(`https://demowebshop.tricentis.com/computers`, {
            headers: {},
            
        });

        console.log("Request: Computers data");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        check(res_0, {
            "status 200": (r) => r.status === 200,
            "response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        // ── Desktops ──
        let res_1 = http.get(`https://demowebshop.tricentis.com/desktops`, {
            headers: {},
            
        });

        console.log("Request: Desktops");
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
            "response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        // ── Notebooks data ──
        let res_2 = http.get(`https://demowebshop.tricentis.com/notebooks`, {
            headers: {},
            
        });

        console.log("Request: Notebooks data");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        check(res_2, {
            "status 200": (r) => r.status === 200,
            "response time < 2000ms": (r) => r.timings.duration <= 2000
        });

    }
}
