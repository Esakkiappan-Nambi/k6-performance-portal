


import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
    vus: 10,
    duration: "10s"
};

export default function () {
    let variables = {};

    

    for (let i = 0; i < 1; i++) {
        
        let res_0 = http.request(
            "POST",
            "https://reqres.in/api/login"
        );

        console.log("Request: Request 1");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);
        
        try {
            variables.token = res_0.json("token");
            console.log("Extracted token:", variables.token);
        } catch (err) {
            console.log("Extraction failed for token");
        }

        let res_1 = http.get("https://reqres.in/api/users/2");

        console.log("Request: Request 2");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);
        
        try {
            variables.Bearer = res_1.json(" {{token}}");
            console.log("Extracted Bearer:", variables.Bearer);
        } catch (err) {
            console.log("Extraction failed for Bearer");
        }

        sleep(0.1);
    }
}
