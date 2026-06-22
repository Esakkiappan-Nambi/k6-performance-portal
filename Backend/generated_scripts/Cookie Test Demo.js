


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "20s", target: 5 }, // hold load
        { duration: "5s", target: 0 }                 // ramp-down
    ]
};

export default function () {
    let variables = {};

    
    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://gorest.co.in/public/v2/users",'{"name": "John Doe", "gender": "male", "email": "john000doe@example.com", "status": "active"}',
            {
                headers: {
                ...{"Content-Type": "application/json", "Authorization": "Bearer c36267abbf33662b363b7640e3aefd0a57e6d2ef6c5ded4c4b8db6793c957987"},
            "Content-Type": "application/json"
            }
            }
        );

        console.log("Request: Create user");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);
        
                    sleep(100 / 1000);

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
                r.timings.duration <= 1000
            });

        let res_1 = http.get("https://gorest.co.in/public/v2/users/${id}",{
                headers: {"Authorization": "Bearer c36267abbf33662b363b7640e3aefd0a57e6d2ef6c5ded4c4b8db6793c957987"}
        });

        console.log("Request: Get User");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);
        
            check(res_1, {
            "status check": (r) =>
                r.status === 200,
                "response time check": (r) =>
                r.timings.duration <= 1000
            });

        
    }
}
