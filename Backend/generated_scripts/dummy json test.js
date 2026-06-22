
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "10s", target: 5 },  // hold load
        { duration: "5s", target: 0 }          // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    
    

    for (let i = 0; i < 1; i++) {

        // ── Request 1 ──
        let res_0 = http.request(
            "POST",
            `https://dummyjson.com/auth/login`,
            JSON.stringify({
  "username": "emilys",
  "password": "emilyspass"
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Request 1");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        try {
            variables.token = res_0.json("accessToken");
            console.log("Extracted token:", variables.token);
        } catch (err) {
            console.log("Extraction failed for token:", err);
        }

        check(res_0, {
            "status 200": (r) => r.status === 200,
            "response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        // ── Auth me ──
        let res_1 = http.get(`https://dummyjson.com/auth/me`, {
            headers: {
  "Authorization": `Bearer ${variables.token}`
}
        });

        console.log("Request: Auth me");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        check(res_1, {
            "status 200": (r) => r.status === 200,
            "response time < 1000ms": (r) => r.timings.duration <= 1000
        });

        
    }
}
