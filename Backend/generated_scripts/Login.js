


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 5,
    duration: "20s"
};

export default function () {
    

    for (let i = 0; i < 2; i++) {
        
        let res_0 = http.get("https://google.com");

        console.log("Request: Login");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        let res_1 = http.get("https://google.com");

        console.log("Request: get ");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        sleep(0.1);
    }
}
