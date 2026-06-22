

import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("uploaded_csv\a5d2f020-77dc-4f94-9aae-5e9960f961dc_Book 4(Sheet1).csv")
        .split("\n")
        .slice(1)
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
    
    const data = csvData[__VU % csvData.length];


    for (let i = 0; i < 1; i++) {
        
        let res = http.request(
            "POST",
            "https://reqres.in/api/login"
        );

        check(res, {
            "status check": (r) => r.status === 200,
            "response time check": (r) => r.timings.duration <= 1000
        });

        let res = http.request(
            "GET",
            "https://reqres.in/api/users?page=2"
        );

        check(res, {
            "status check": (r) => r.status === 200,
            "response time check": (r) => r.timings.duration <= 1000
        });

        sleep(1);
    }
}
