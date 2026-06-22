


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
            "https://jsonplaceholder.typicode.com/posts",'{"title": "foo", "body": "bar", "userId": 1}',
            {
                headers: {
                ...{"Content-Type": "application/json"},
            "Content-Type": "application/json"
            }
            }
        );

        console.log("Request: Login Request ");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);
        
try {
            variables.id = res_0.json("id");
            console.log("Extracted id:", variables.id);
    } catch (err) {
            console.log("Extraction failed for id");
    }

            check(res_0, {
            "status check": (r) =>
                r.status === 200,
                "response time check": (r) =>
                r.timings.duration <= 500
            });

        let res_1 = http.get("https://jsonplaceholder.typicode.com/posts/1",{
                headers: {"Authorization": "Bearer ${id}"}
        });

        console.log("Request: Get Request");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);
        
                    sleep(1000 / 1000);

            check(res_1, {
            "status check": (r) =>
                r.status === 200,
                "response time check": (r) =>
                r.timings.duration <= 500
            });

        
    }
}
