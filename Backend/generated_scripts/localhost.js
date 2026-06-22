

import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("uploaded_csv\75bc75b6-c7af-4e28-9fdd-ae3eecf2369b_Book 4(Sheet1).csv")
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
            duration: "10s",
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


    for (let i = 0; i < 2; i++) {
        
        let res0 = http.request(
            "POST",
            "localhost:5173"
        );

        check(res0, {
            "status is 200": (r) => r.status === 200
        });

        sleep(1);
    }
}
