

import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Learning/K6-UI/Backend/uploaded_csv/2a0e98df-21af-456f-9cd2-8383189f0692_Book 4(Sheet1).csv")
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


    for (let i = 0; i < 2; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://reqres.in/api/login"
        );

        check(res_0, {
            "status is 200": (r) => r.status === 200
        });

        sleep(1);
    }
}
