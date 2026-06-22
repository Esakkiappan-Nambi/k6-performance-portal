
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        {
            duration: "2s",
            target: 5
        },
        {
            duration: "5s",
            target: 5
        },
        {
            duration: "10s",
            target: 0
        }
    ]
};

export default function () {
    for (let i = 0; i < 2; i++) {
        
        let res = http.get("https://www.google.com");
        check(res, {
            "status is 200": (r) => r.status === 200
        });

        sleep(1);
    }
}
