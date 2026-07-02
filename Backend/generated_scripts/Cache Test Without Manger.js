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
    
            
    
        }
    }
    