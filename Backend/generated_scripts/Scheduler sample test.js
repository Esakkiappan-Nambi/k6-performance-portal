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
    
    
    // Scheduled Test | Frequency: once | Start: 2026-06-26T18:04 | End: 2026-06-26T18:06
    const variables = {};
    

    
        // Scheduler: wait until start time
        const scheduleStart = new Date("2026-06-26T18:04:00").getTime();
        if (Date.now() < scheduleStart) {
            const waitMs = scheduleStart - Date.now();
            console.log("Waiting until scheduled start:", "2026-06-26T18:04:00");
            sleep(waitMs / 1000);
        }

    
        // Scheduler: stop after end time
        const scheduleEnd = new Date("2026-06-26T18:06:00").getTime();
        if (Date.now() > scheduleEnd) {
            console.log("Schedule expired. Stopping test.");
            return;
        }


    for (let i = 0; i < 2; i++) {
        // Cookie Manager disabled - clearing cookies each iteration
        http.cookieJar().clearAll();
        // Cache disabled - no caching applied
        

        // ── Request 1 ──
        let res_0 = http.get(`https://jsonplaceholder.typicode.com/users/1`, {
            headers: {}
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

    }
}
