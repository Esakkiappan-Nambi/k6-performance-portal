import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");




export const options = {
    stages: [
        { duration: "5s", target: 5 },
        { duration: "2s", target: 5 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    const variables = {};
    

    
    

    for (let i = 0; i < 2; i++) {
        // Cookie Manager disabled - clearing cookies each iteration
  
        
    // Cache disabled
    
        

        // ── GET ──
        let res_0 = http.get(`https://demowebshop.tricentis.com/api/users?page=1`, {
                headers: {}
            });

        console.log("Request: GET");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

        // ── GET api / users ──
        let res_1 = http.get(`https://demowebshop.tricentis.com/api/users?page=2`, {
                headers: {}
            });

        console.log("Request: GET api / users");
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

        // ── GET users / 2 ──
        let res_2 = http.get(`https://demowebshop.tricentis.com/api/users/2`, {
                headers: {}
            });

        console.log("Request: GET users / 2");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET users / 23 ──
        let res_3 = http.get(`https://demowebshop.tricentis.com/api/users/23`, {
                headers: {}
            });

        console.log("Request: GET users / 23");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET api / unknown ──
        let res_4 = http.get(`https://demowebshop.tricentis.com/api/unknown`, {
                headers: {}
            });

        console.log("Request: GET api / unknown");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET unknown / 2 ──
        let res_5 = http.get(`https://demowebshop.tricentis.com/api/unknown/2`, {
                headers: {}
            });

        console.log("Request: GET unknown / 2");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST api / users ──
        let res_6 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/api/users`,
            "{\"name\": \"morpheus\", \"job\": \"leader\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST api / users");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

        // ── PUT users / 2 ──
        let res_7 = http.request(
            "PUT",
            `https://demowebshop.tricentis.com/api/users/2`,
            "{\"name\": \"morpheus\", \"job\": \"zion resident\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: PUT users / 2");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1002 / 1000);

        // ── PATCH users / 2 ──
        let res_8 = http.request(
            "PATCH",
            `https://demowebshop.tricentis.com/api/users/2`,
            "{\"name\": \"morpheus\", \"job\": \"zion resident\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: PATCH users / 2");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

        // ── DELETE users / 2 ──
        let res_9 = http.request(
            "DELETE",
            `https://demowebshop.tricentis.com/api/users/2`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: DELETE users / 2");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

        // ── POST api / register ──
        let res_10 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/api/register`,
            "{\"email\": \"eve.holt@reqres.in\", \"password\": \"pistol\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST api / register");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

        // ── POST api / login ──
        let res_11 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/api/login`,
            "{\"email\": \"eve.holt@reqres.in\", \"password\": \"cityslicka\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST api / login");
        console.log("Status:", res_11.status);
        console.log("Body:", res_11.body);

        aggregateResponseTime.add(res_11.timings.duration);

        if (res_11.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1001 / 1000);

    }
}
