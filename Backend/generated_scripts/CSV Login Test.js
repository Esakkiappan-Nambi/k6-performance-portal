import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Learning/K6-UI/Backend/uploaded_csv/b47f9b80-f608-4e7b-b6fa-edfc8447e6d7_Dummy.csv")
        .split("\n")
        .slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {
            const cols = line.split(",");
            return { email: cols[0], password: cols[1] };
        });
});


import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time");
const aggregateErrors = new Counter("aggregate_errors");
const aggregateFailureRate = new Rate("aggregate_failure_rate");

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "10s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    
    const data = csvData[(__VU - 1) % csvData.length];
    console.log("VU:", __VU, "User:", JSON.stringify(data));

    for (let i = 0; i < 2; i++) {

        // ── Login Request ──
        let res_0 = http.get(`https://reqres.in/api/login`, {
            headers: {
  "Content-Type": "application/json",
  "x-api-key": "reqres_13adb9008546419d9a83a2e935031afa"
}
        });

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
        sleep(999 / 1000);

        try {
            variables.token = res_0.json("token");
            console.log("Extracted token:", variables.token);
        } catch (err) {
            console.log("Extraction failed for token:", err);
        }

        check(res_0, {
            "Login Request status 200": (r) => r.status === 200,
            "Login Request response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        
    }
}

export function handleSummary(data) {
    return {
        "summary.json": JSON.stringify(data, null, 2),
    };
}
