


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 5,
    duration: "10s"
};

export default function () {
    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.request(
            "POST",
            "  https://jsonplaceholder.typicode.com/posts"
        );

        console.log("Request: sample login");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        check(res_0, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 499
        });

        let res_1 = http.get(" https://jsonplaceholder.typicode.com/posts/1");

        console.log("Request: Sample login2");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        check(res_1, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 499
        });

        sleep(0.1);
    }
}
