


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 5,
    duration: "20s"
};

export default function () {
    

    for (let i = 0; i < 3; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://jsonplaceholder.typicode.com/posts"
        );

        console.log("Request: Request 1");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        sleep(0.1);
    }
}
