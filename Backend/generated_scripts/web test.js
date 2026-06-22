

import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Learning/K6-UI/Backend/uploaded_csv/a46fdd94-490c-4821-9e9e-f2144ac81767_Book 5(Sheet1).csv")
        .split("\n")
        .slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {
            const cols = line.split(",");

            return {
                email: cols[0], password: cols[1]
            };
        });
});


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 5,
    duration: "20s"
};

export default function () {
    
    const data = csvData[(__VU - 1) % csvData.length];
    console.log("VU:", __VU, "User:", JSON.stringify(data));


    for (let i = 0; i < 2; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://reqres.in/api/login"
        );

        console.log("Request: Login");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        check(res_0, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 1000
        });

        sleep(0.1);
    }
}
