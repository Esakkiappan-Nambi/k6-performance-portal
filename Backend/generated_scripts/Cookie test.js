
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        { duration: "5s", target: 5 },   // ramp-up
        { duration: "10s", target: 5 },  // hold load
        { duration: "5s", target: 0 }        // ramp-down
    ]
};

export default function () {
    let variables = {};   // shared variable bag (JWT tokens, etc.)
    const jar = http.cookieJar(); // HTTP Cookie Manager
    

    for (let i = 0; i < 1; i++) {

        // ── Login Request  ──
        let res_0 = http.request(
            "POST",
            `https://dummyjson.com/auth/login`,
            JSON.stringify({
  "username": "emilys",
  "password": "emilyspass",
  "expiresInMins": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Login Request ");
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
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Get Profile Request  ──
        let res_1 = http.get(`https://dummyjson.com/auth/me`, {
            headers: {
  "Authorization": `Bearer ${variables.token}`
}
        });

        console.log("Request: Get Profile Request ");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        check(res_1, {
            "status 200": (r) => r.status === 200,
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // ── Refresh token Request ──
        let res_2 = http.request(
            "POST",
            `https://dummyjson.com/auth/refresh`,
            JSON.stringify({
  "refreshToken": `${variables.token}`,
  "expiresInMins": 1
}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: Refresh token Request");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);
        sleep(1000 / 1000);

        check(res_2, {
            "status 200": (r) => r.status === 200,
            "response time < 3000ms": (r) => r.timings.duration <= 3000
        });

        // Clear cookies (JMeter: clear each iteration)
        jar.clear("https://dummyjson.com");
    }
}
