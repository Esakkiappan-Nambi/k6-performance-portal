

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "24s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    const jar = http.cookieJar(); // HTTP Cookie Manager
    

    for (let i = 0; i < 2; i++) {

        // ── Get Request ──
        let res_0 = http.get(`https://demowebshop.tricentis.com/`, {
            headers: {}
        });

        console.log("Request: Get Request");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(19 / 1000);

        check(res_0, {
            "Get Request status 200": (r) => r.status === 200,
            "Get Request response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        // ── Login Request method ──
        let res_1 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/login`,
            null,
            { headers: {
  "Content-Type": "application/x-www-form-urlencoded"
} }
        );

        console.log("Request: Login Request method");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(19 / 1000);

        // ── Demo cart  ──
        let res_2 = http.request(
            "POST",
            ` https://demowebshop.tricentis.com/addproducttocart/details/31/1`,
            null,
            { headers: {
  "Content-Type": "application/x-www-form-urlencoded"
} }
        );

        console.log("Request: Demo cart ");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(19 / 1000);

        // ── Cart Request method ──
        let res_3 = http.get(` https://demowebshop.tricentis.com/cart`, {
            headers: {}
        });

        console.log("Request: Cart Request method");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(19 / 1000);

        // Clear cookies (JMeter: clear each iteration)
        jar.clear("https://demowebshop.tricentis.com");
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
