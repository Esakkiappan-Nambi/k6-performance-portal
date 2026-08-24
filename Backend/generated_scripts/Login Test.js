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
    
            
    
        // ── POST 1 / 1 ──
        let res_0 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/2/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
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
    