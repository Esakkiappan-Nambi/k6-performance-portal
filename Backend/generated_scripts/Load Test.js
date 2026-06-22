


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 50,
    duration: "200s"
};

export default function () {
    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://jsonplaceholder.typicode.com/posts"
        );

        console.log("Request: Login");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        check(res_0, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 999
        });

        sleep(0.1);
    }
}
