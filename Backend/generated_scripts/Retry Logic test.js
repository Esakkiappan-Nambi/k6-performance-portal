import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");
 
export const options = {
    stages: [
        { duration: "10s", target: 10 },
        { duration: "19s", target: 10 },
        { duration: "5s", target: 0 },
    ],
};
 
export default function () {
    
    
    const variables = {};
    
 
    for (let i = 0; i < 1; i++) {
        
        
        

        // ── Login Request (with retry logic) ──
        let res_0;
        {
            const __retryCodes_0 = [500, 502, 503, 429, 504, 408];
            const __maxRetries_0 = 3;
            const __retryDelay_0 = 1000;
            const __retryOnTimeout_0 = true;
 
            for (let __attempt_0 = 0; __attempt_0 <= __maxRetries_0; __attempt_0++) {
                try {
                    res_0 = http.request(
            "POST",
            `https://dummyjson.com/auth/login`,
            JSON.stringify({
"username": "emilys",
"password": "emilyspass"
}),
            { headers: {
  "Content-Type": "application/json",
  "Accept": "application/json"
} }
        );
 
                    // Break if status is not in retry codes
                    if (!__retryCodes_0.includes(res_0.status)) {
                        if (__attempt_0 > 0) {
                            console.log("Retry succeeded for Login Request on attempt", __attempt_0 + 1);
                        }
                        break;
                    }
 
                    if (__attempt_0 < __maxRetries_0) {
                        console.warn(
                            "Retrying Login Request (attempt", __attempt_0 + 1, "of", __maxRetries_0,
                            ") — status:", res_0.status
                        );
                        sleep(__retryDelay_0 / 1000);
                    } else {
                        console.error("Login Request failed after", __maxRetries_0, "retries — status:", res_0.status);
                    }
                } catch (__err_0) {
                    // Network / timeout error
                    if (__retryOnTimeout_0 && __attempt_0 < __maxRetries_0) {
                        console.warn(
                            "Retrying Login Request after error (attempt", __attempt_0 + 1, "):", __err_0.message
                        );
                        sleep(__retryDelay_0 / 1000);
                    } else {
                        console.error("Login Request network error after retries:", __err_0.message);
                        throw __err_0;
                    }
                }
            }
        }

        console.log("Request: Login Request");
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
            variables.accessToken = res_0.json("accessToken");
            console.log("Extracted accessToken:", variables.accessToken);
        } catch (err) {
            console.log("Extraction failed for accessToken:", err);
        }

        // ── Get Request ──
        let res_1 = http.get(`https://dummyjson.com/auth/me`, {
            headers: {
  "Authorization": `Bearer ${variables.accessToken}`
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

    }
}
