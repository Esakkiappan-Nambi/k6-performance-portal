


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "10s", target: 5 }, // hold load
        { duration: "5s", target: 0 }                 // ramp-down
    ]
};

export default function () {
    let variables = {};

    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.get("http://localhost:8000/createtest");

                        console.log("Request: Create test Request");
                        console.log("Status:", res_0.status);
                        console.log("Body:", res_0.body);
        
                    sleep(1000 / 1000);

        let res_1 = http.get("http://localhost:8000/profile");

                        console.log("Request: Profile Request");
                        console.log("Status:", res_1.status);
                        console.log("Body:", res_1.body);
        
                    sleep(1001 / 1000);

    }
}
