

import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Learning/K6-UI/Backend/uploaded_csv/525a1f91-ebd8-4e86-af21-bb4d140386ac_Book 5.xlsx")
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
    stages: [
        {
            duration: "5s",
            target: 5
        },
        {
            duration: "20s",
            target: 5
        },
        {
            duration: "10s",
            target: 0
        }
    ]
};

export default function () {
    
    const data = csvData[(__VU - 1) % csvData.length];


    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://reqres.in/api/login"
        );

        check(res_0, {
            "status check": (r) => r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 1000
        });

        let res_1 = http.get(
            "https://reqres.in/api/users?page=2"
        );

        check(res_1, {
            "status check": (r) => r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 1000
        });

        sleep(1);
    }
}
