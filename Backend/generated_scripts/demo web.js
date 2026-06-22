


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 20,
    duration: "25s"
};

export default function () {
    let variables = {};

    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.get("https://demowebshop.tricentis.com/computers");

        console.log("Request: Computers data");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);
        
        check(res_0, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 2000
        });

        let res_1 = http.get("https://demowebshop.tricentis.com/desktops");

        console.log("Request: Desktops");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);
        
        check(res_1, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 2000
        });

        let res_2 = http.get("https://demowebshop.tricentis.com/notebooks");

        console.log("Request: Notebooks data");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);
        
        check(res_2, {
            "status check": (r) =>
                r.status === 200,
            "response time check": (r) =>
                r.timings.duration <= 2000
        });

        sleep(0.1);
    }
}
