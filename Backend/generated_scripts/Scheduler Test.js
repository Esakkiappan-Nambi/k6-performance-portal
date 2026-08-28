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
<<<<<<< HEAD
    // Scheduled Test | Frequency: once | Start: 2026-07-02T18:23 | End: 2026-07-02T18:25
=======
    // Scheduled Test | Frequency: once | Start: 2026-07-01T09:53 | End: 2026-07-01T09:54
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
    const variables = {};
    

    
        // Scheduler: wait until start time
<<<<<<< HEAD
        const scheduleStart = new Date("2026-07-02T18:23:00").getTime();
        if (Date.now() < scheduleStart) {
            const waitMs = scheduleStart - Date.now();
            console.log("Waiting until scheduled start:", "2026-07-02T18:23:00");
=======
        const scheduleStart = new Date("2026-07-01T09:53:00").getTime();
        if (Date.now() < scheduleStart) {
            const waitMs = scheduleStart - Date.now();
            console.log("Waiting until scheduled start:", "2026-07-01T09:53:00");
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
            sleep(waitMs / 1000);
        }

    
        // Scheduler: stop after end time
<<<<<<< HEAD
        const scheduleEnd = new Date("2026-07-02T18:25:00").getTime();
=======
        const scheduleEnd = new Date("2026-07-01T09:54:00").getTime();
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
        if (Date.now() > scheduleEnd) {
            console.log("Schedule expired. Stopping test.");
            return;
        }


    for (let i = 0; i < 2; i++) {
<<<<<<< HEAD
        
        // ── Request 1 (with retry logic) ──
        let res_0;
        {
            const __retryCodes_0 = [500, 502, 503];
            const __maxRetries_0 = 3;
            const __retryDelay_0 = 1000;
            const __retryOnTimeout_0 = true;

            for (let __attempt_0 = 0; __attempt_0 <= __maxRetries_0; __attempt_0++) {
                try {
                    res_0 = http.get(`https://jsonplaceholder.typicode.com/users/`, {
            headers: {},
            
        });

                    if (!__retryCodes_0.includes(res_0.status)) {
                        if (__attempt_0 > 0) {
                            console.log("Retry succeeded for Request 1 on attempt", __attempt_0 + 1);
                        }
                        break;
                    }

                    if (__attempt_0 < __maxRetries_0) {
                        console.warn(
                            "Retrying Request 1 (attempt", __attempt_0 + 1, "of", __maxRetries_0,
                            ") — status:", res_0.status
                        );
                        sleep(__retryDelay_0 / 1000);
                    } else {
                        console.error("Request 1 failed after", __maxRetries_0, "retries — status:", res_0.status);
                    }
                } catch (__err_0) {
                    if (__retryOnTimeout_0 && __attempt_0 < __maxRetries_0) {
                        console.warn(
                            "Retrying Request 1 after error (attempt", __attempt_0 + 1, "):", __err_0.message
                        );
                        sleep(__retryDelay_0 / 1000);
                    } else {
                        console.error("Request 1 network error after retries:", __err_0.message);
                        throw __err_0;
                    }
                }
            }
        }
=======
        // Cookie Manager disabled - clearing cookies each iteration
  
        
    // Cache disabled
    
        

        // ── Request 1 ──
        let res_0 = http.get(`https://jsonplaceholder.typicode.com/users/1`, {
                headers: {}
            });
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603

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

<<<<<<< HEAD
        check(res_0, {
            "Request 1 status 200": (r) => r.status === 200,
            "Request 1 response time < 29999ms": (r) => r.timings.duration <= 29999
        });

=======
>>>>>>> 12661e306beed1a3faafbec5438b9bfcf1c0d603
    }
}
