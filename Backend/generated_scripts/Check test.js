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
    

    
    

    for (let i = 0; i < 2; i++) {
        // Cookie Manager disabled - clearing cookies each iteration
  
        
    // Cache disabled
    
        

        // ── Login request ──
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

        console.log("Request: Login request");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // Extract variable: authToken
        try {
            variables.authToken = res_0.json("token");
            console.log("Extracted authToken =", variables.authToken);
        } catch (e) {
            console.warn("Failed to extract authToken from path token:", e.message);
        }
        sleep(1000 / 1000);

        // ── Get Request  ──
        let res_1 = http.get(`https://reqres.in/api/users/2`, {
                headers: {
  "x-api-key": "reqres_13adb9008546419d9a83a2e935031afa",
  "Authorization": `Bearer ${variables.authToken}`
}
            });

        console.log("Request: Get Request ");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(100 / 1000);

    }
}
