import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";


const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");




export const options = {
    stages: [
        { duration: "2s", target: 2 },
        { duration: "2s", target: 2 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    const variables = {
    access_token: `eyJhbGciOiJSUzI1NiIsImtpZCI6InY2d1NHQ2lFVEdiRE1NUU5QRV9ad2N3dkNNa0w2WElrYVFDTEJRbXdidjQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJjNGJhNzRkMy0xYWZmLTQ4NmUtOGIyNC0zYzQ2ZTE1Njc2MWEiLCJpc3MiOiJodHRwczovL2R3dGNpZHAuYjJjbG9naW4uY29tL3RmcC9mMmEwMDkxNi0wOGJkLTRiMDEtOWZhMS1jNjc5ODBhNGJmMzcvYjJjXzFhX3NpZ251cF9zaWduaW5fdGZwX3Btc19hcHBfZGV2L3YyLjAvIiwiZXhwIjoxNzgyNDU2NTAyLCJuYmYiOjE3ODI0NTI5MDIsInN1YiI6ImQ1YTdhNzQ1LTM0OGQtNGM4ZS1hMTg5LTQ5ZTdiZjViNGI0ZSIsIm9pZCI6ImQ1YTdhNzQ1LTM0OGQtNGM4ZS1hMTg5LTQ5ZTdiZjViNGI0ZSIsInN0cmVldEFkZHJlc3MiOiJEdWJhaSIsInByZWZpeCI6Ik1yIiwiY2l0eSI6IkR1YmFpIiwibW9iaWxlIjoiOTk0MDgyMDMwMyIsImdpdmVuX25hbWUiOiJXaWtpIiwiZmFtaWx5X25hbWUiOiJXaWtpIiwiZW1haWwiOiJ2aWduZXNod2FyYW5pbGFuZ292YW4wOUBnbWFpbC5jb20iLCJzeXN0ZW1EYXRlVGltZSI6MTc4MjQ1MjkwMSwiaXNGb3Jnb3RQYXNzd29yZCI6ZmFsc2UsImR3dGNSb2xlIjoiMS4wIiwidGlkIjoiZjJhMDA5MTYtMDhiZC00YjAxLTlmYTEtYzY3OTgwYTRiZjM3IiwiYXpwIjoiYzRiYTc0ZDMtMWFmZi00ODZlLThiMjQtM2M0NmUxNTY3NjFhIiwidmVyIjoiMS4wIiwiaWF0IjoxNzgyNDUyOTAyfQ.EvukSpkGhN57opfs0MxVdYm5yXT54bsyUtprUCabkarVcmudAlF84t1vbAIhEgbVvNiKSVkBjJhbBhgHCkMSKE4Sk2a2PH0xSaLcIzq2cAOe-xOK0X23o1E6vqyfY6uGlxYbQfXmMhrShSWO4rrKFC9kArT4CiErFcy02Hb6AUz0KtA0TN84LLp97WzUIbZ7J2aJQK005extjUyFw7G3Qh4rA6tbn_6Rrewvjow7SMEEcT1PdoH9hGGJw7Lp5OJbLETbXyJ7cVy82Y_eHELAjfTBM2C-XbMrvXYxzzjcoQsY7wQAsJO9R8vWyFNr0XK7scb2Gcq9UVc1x4urnnmY8w`
};
    

    
    

    for (let i = 0; i < 2; i++) {
        
        
        

        // ── Request 1 ──
        let res_0 = http.request(
        "POST",
        `https://api-sandbox.dwtc.com/pms/api/v1/auth/session`,
        "{\n  \"azureToken\": {{access_token}},\n  \"tokenType\": \"b2c\",\n  \"deviceId\": \"crypto.randomUUID()\"\n}",
        { headers: {
  "Content-Type": "application/json",
  "accept": "application/json",
  "Authorization": "Bearer ${token}",
  "Ocp-Apim-subscription-key": "63cedf5ec86140c28f15badae27aa810",
  "X-PMS-Webhook-Key": "e5837221-db4d-45c8-b327-02aad30c0ca5"
},  }
    );

        console.log("Request: Request 1");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // Extract variable: token
        try {
            variables.token = res_0.json("token");
            console.log("Extracted token =", variables.token);
        } catch (e) {
            console.warn("Failed to extract token from path token:", e.message);
        }
        sleep(100 / 1000);

        // ── Request 2 ──
        let res_1 = http.request(
        "POST",
        `https://api-sandbox.dwtc.com/pms/api/v1/tickets/search`,
        JSON.stringify({
"licensePlate": "AA 12345"
}),
        { headers: {
  "Content-Type": "application/json",
  "accept": "application/json",
  "Authorization": "Bearer ${token}",
  "Ocp-Apim-subscription-key": "63cedf5ec86140c28f15badae27aa810",
  "X-PMS-Webhook-Key": "e5837221-db4d-45c8-b327-02aad30c0ca5"
},  }
    );

        console.log("Request: Request 2");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }
        sleep(1000 / 1000);

    }
}
