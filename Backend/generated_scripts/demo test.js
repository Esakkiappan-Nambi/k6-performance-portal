
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    stages: [
        {
            duration: "15s",
            target: 20
        },
        {
            duration: "30s",
            target: 20
        },
        {
            duration: "10s",
            target: 0
        }
    ]
};

export default function () {
    for (let i = 0; i < 2; i++) {
        
        let res = http.get("https://demowebshop.tricentis.com/");
        check(res, {
            "status is 200": (r) => r.status === 200
        });

        sleep(1);
    }
}
