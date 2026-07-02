import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Pictures/Screenshots/K6-UI/Backend/uploads/Book 6(Sheet1).csv")
        .split("\n")
        .slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {
            const cols = line.split(",");
            return { name: cols[0], email: cols[1], title: cols[2], body: cols[3] };
        });
});

const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "3s", target: 3 },
        { duration: "10s", target: 3 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    
    
    const variables = {};
    

    
    

    for (let i = 0; i < 1; i++) {
        
        
        const data = csvData[(__VU - 1) % csvData.length];
    console.log("VU:", __VU, "User:", JSON.stringify(data));

        // ── Request 1 ──
        let res_0 = http.request(
            "POST",
            `https://jsonplaceholder.typicode.com/posts`,
            JSON.stringify({
"title": "{{title}}",
"body": "{{body}}",
"user": "{{name}}",
"email": "{{email}}"
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

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
        sleep(1000 / 1000);

    }
}
