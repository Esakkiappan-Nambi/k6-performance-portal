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
        let res_0 = http.get(`https://dummyjson.com/`, {
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

        // ── GET getconfig / sodar ──
        let res_1 = http.get(`https://ep1.adtrafficquality.google/getconfig/sodar?sv=200&tid=gda&tv=r20260625&st=env&sjk=2249381438754093`, {
                headers: {}
            });

        console.log("Request: GET getconfig / sodar");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET 255 / runner.html ──
        let res_2 = http.get(`https://ep2.adtrafficquality.google/sodar/sodar2/255/runner.html`, {
                headers: {}
            });

        console.log("Request: GET 255 / runner.html");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET api2 / aframe ──
        let res_3 = http.get(`https://www.google.com/recaptcha/api2/aframe`, {
                headers: {}
            });

        console.log("Request: GET api2 / aframe");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST c / generate ──
        let res_4 = http.request(
            "POST",
            `https://dummyjson.com/c/generate`,
            "{\"json\": {\"foo\": \"bar\"}, \"method\": \"GET\"}",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST c / generate");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET getconfig / sodar ──
        let res_5 = http.get(`https://ep1.adtrafficquality.google/getconfig/sodar?sv=200&tid=gda&tv=r20260625&st=env&sjk=7044742369166388`, {
                headers: {}
            });

        console.log("Request: GET getconfig / sodar");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET docs ──
        let res_6 = http.get(`https://dummyjson.com/docs`, {
                headers: {}
            });

        console.log("Request: GET docs");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET tools ──
        let res_7 = http.get(`https://dummyjson.com/tools`, {
                headers: {}
            });

        console.log("Request: GET tools");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET docs / image ──
        let res_8 = http.get(`https://dummyjson.com/docs/image`, {
                headers: {}
            });

        console.log("Request: GET docs / image");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET products ──
        let res_9 = http.get(`https://dummyjson.com/products`, {
                headers: {}
            });

        console.log("Request: GET products");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET carts ──
        let res_10 = http.get(`https://dummyjson.com/carts`, {
                headers: {}
            });

        console.log("Request: GET carts");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET users ──
        let res_11 = http.get(`https://dummyjson.com/users`, {
                headers: {}
            });

        console.log("Request: GET users");
        console.log("Status:", res_11.status);
        console.log("Body:", res_11.body);

        aggregateResponseTime.add(res_11.timings.duration);

        if (res_11.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET posts ──
        let res_12 = http.get(`https://dummyjson.com/posts`, {
                headers: {}
            });

        console.log("Request: GET posts");
        console.log("Status:", res_12.status);
        console.log("Body:", res_12.body);

        aggregateResponseTime.add(res_12.timings.duration);

        if (res_12.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET comments ──
        let res_13 = http.get(`https://dummyjson.com/comments`, {
                headers: {}
            });

        console.log("Request: GET comments");
        console.log("Status:", res_13.status);
        console.log("Body:", res_13.body);

        aggregateResponseTime.add(res_13.timings.duration);

        if (res_13.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET quotes ──
        let res_14 = http.get(`https://dummyjson.com/quotes`, {
                headers: {}
            });

        console.log("Request: GET quotes");
        console.log("Status:", res_14.status);
        console.log("Body:", res_14.body);

        aggregateResponseTime.add(res_14.timings.duration);

        if (res_14.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET todos ──
        let res_15 = http.get(`https://dummyjson.com/todos`, {
                headers: {}
            });

        console.log("Request: GET todos");
        console.log("Status:", res_15.status);
        console.log("Body:", res_15.body);

        aggregateResponseTime.add(res_15.timings.duration);

        if (res_15.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET recipes ──
        let res_16 = http.get(`https://dummyjson.com/recipes`, {
                headers: {}
            });

        console.log("Request: GET recipes");
        console.log("Status:", res_16.status);
        console.log("Body:", res_16.body);

        aggregateResponseTime.add(res_16.timings.duration);

        if (res_16.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

    }
}
