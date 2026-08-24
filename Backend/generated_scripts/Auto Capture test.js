import http from "k6/http";
    import { check, sleep } from "k6";
    import { Trend, Counter, Rate } from "k6/metrics";
    

    const aggregateResponseTime = new Trend("aggregate_response_time", true);
    const aggregateErrors       = new Counter("aggregate_errors");
    const aggregateFailureRate  = new Rate("aggregate_failure_rate");

    
    

    export const options = {
        stages: [
            { duration: "5s", target: 5 },
            { duration: "10s", target: 5 },
            { duration: "5s", target: 0 },
        ],
    };

    export default function () {
        
        const variables = {};
        

        
        

        for (let i = 0; i < 2; i++) {
            // Cookie Manager disabled - clearing cookies each iteration
  
            
    // Cache disabled
    
            
    
        // ── POST g / collect ──
        let res_4 = http.request(
            "POST",
            `https://www.google.com/g/collect?v=2&tid=G-E3C3GCQVBN&gtm=45je66o1v884780828za200zd884780828&_p=1782726164778&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=829819991.1782726160&frm=0&pscdl=noapi&rcb=4&sr=1280x720&uaa=x86&uab=64&uafvl=Chromium%3B148.0.7778.96%7CHeadlessChrome%3B148.0.7778.96%7CNot%252FA%29Brand%3B99.0.0.0&uam=&uamb=0&uap=Windows&uapv=10.0&uaw=0&ul=en-gb&_s=1&tag_exp=115616985%7E115938465%7E115938469%7E119027224%7E119576881%7E119576885%7E119576891%7E119576895&sid=1782726160&sct=1&seg=1&dl=https%3A%2F%2Fjsonplaceholder.typicode.com%2F&dr=https%3A%2F%2Fjsonplaceholder.typicode.com%2F&dt=JSONPlaceholder+-+Free+Fake+REST+API&en=page_view&_ee=1&tfd=843&gaf=1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST g / collect");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        }
    }
    