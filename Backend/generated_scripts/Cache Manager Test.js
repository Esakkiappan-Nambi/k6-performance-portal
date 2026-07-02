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
        
        
        

        // ── Get  Request ──
        let res_0 = http.get(`https://jsonplaceholder.typicode.com/posts?_limit=${encodeURIComponent(`5`)}&_page=${encodeURIComponent(`1`)}`, {
            headers: {
  "ETag": "abc123",
  "Content-Type": "application/json"
},
            
        });

        console.log("Request: Get  Request");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(500 / 1000);

        check(res_0, {
            "Get  Request status 200": (r) => r.status === 200,
            "Get  Request response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Get Request Post ──
        let res_1 = http.get(`https://jsonplaceholder.typicode.com/posts/1`, {
            headers: {
  "ETag": "abc123",
  "Content-Type": "application/json"
},
            
        });

        console.log("Request: Get Request Post");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // Extract variable: postId
        try {
            variables.postId = res_1.json("id");
            console.log("Extracted postId =", variables.postId);
        } catch (e) {
            console.warn("Failed to extract postId from path id:", e.message);
        }
        sleep(500 / 1000);

        check(res_1, {
            "Get Request Post status 200": (r) => r.status === 200,
            "Get Request Post response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Create Post Request ──
        let res_2 = http.request(
        "POST",
        `https://jsonplaceholder.typicode.com/posts`,
        JSON.stringify({
"title": "Cache Test Post",
"body": "Testing cache manager",
"userId": 1
}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: Create Post Request");
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

        check(res_2, {
            "Create Post Request status 200": (r) => r.status === 200,
            "Create Post Request response time < 3000ms": (r) => r.timings.duration <= 3000
        });

    }
}
