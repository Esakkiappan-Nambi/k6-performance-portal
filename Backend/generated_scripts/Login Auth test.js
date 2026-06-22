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
        
        let res_0 = http.request(
            "POST",
            "https://www.saucedemo.com/"
        );

        console.log("Request: Login ");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);
        
        sleep(0.1);
    }
}
