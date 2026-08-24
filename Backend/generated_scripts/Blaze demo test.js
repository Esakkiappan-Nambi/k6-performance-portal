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
    

    
    

    for (let i = 0; i < 1; i++) {
        // Cookie Manager disabled - clearing cookies each iteration
  
        
    // Cache disabled
    
        

        // ── GET root ──
        let res_0 = http.get(`https://blazedemo.com/`, {
                headers: {}
            });

        console.log("Request: GET root");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST reserve.php ──
        let res_1 = http.request(
            "POST",
            `https://blazedemo.com/reserve.php`,
            "fromPort=Paris&toPort=Buenos+Aires",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST reserve.php");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET reserve.php ──
        let res_2 = http.get(`https://blazedemo.com/reserve.php`, {
                headers: {}
            });

        console.log("Request: GET reserve.php");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST purchase.php ──
        let res_3 = http.request(
            "POST",
            `https://blazedemo.com/purchase.php`,
            "flight=43&price=472.56&airline=Virgin+America&fromPort=&toPort=",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST purchase.php");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET index.php ──
        let res_4 = http.get(`https://blazedemo.com/index.php`, {
                headers: {}
            });

        console.log("Request: GET index.php");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET home ──
        let res_5 = http.get(`https://blazedemo.com/home`, {
                headers: {}
            });

        console.log("Request: GET home");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET login ──
        let res_6 = http.get(`https://blazedemo.com/login`, {
                headers: {}
            });

        console.log("Request: GET login");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET purchase.php ──
        let res_7 = http.get(`https://blazedemo.com/purchase.php`, {
                headers: {}
            });

        console.log("Request: GET purchase.php");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST confirmation.php ──
        let res_8 = http.request(
            "POST",
            `https://blazedemo.com/confirmation.php`,
            "_token=&inputName=&address=&city=&state=&zipCode=&cardType=visa&creditCardNumber=&creditCardMonth=11&creditCardYear=2017&nameOnCard=",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST confirmation.php");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET vacation.html ──
        let res_9 = http.get(`https://blazedemo.com/vacation.html`, {
                headers: {}
            });

        console.log("Request: GET vacation.html");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET confirmation.php ──
        let res_10 = http.get(`https://blazedemo.com/confirmation.php`, {
                headers: {}
            });

        console.log("Request: GET confirmation.php");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

    }
}
