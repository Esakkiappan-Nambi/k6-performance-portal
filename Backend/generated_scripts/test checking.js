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
    

    
    

    for (let i = 0; i < 1; i++) {
        
        
        

        // ── auto_capture_auto_capture_post ──
        let res_0 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/auto-capture`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auto_capture_auto_capture_post");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── auth_capture_endpoint_authenticated_capture_post ──
        let res_1 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/authenticated-capture`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auth_capture_endpoint_authenticated_capture_post");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── auto_generate_auto_generate_post ──
        let res_2 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/auto-generate`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auto_generate_auto_generate_post");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── register_user_register_post ──
        let res_3 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/register`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: register_user_register_post");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── login_user_login_post ──
        let res_4 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/login`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: login_user_login_post");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── create_test_create_test_post ──
        let res_5 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/create-test`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: create_test_create_test_post");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── run_test_run_test__test_id__post ──
        let res_6 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/run-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: run_test_run_test__test_id__post");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── stop_test_stop_test__test_id__post ──
        let res_7 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/stop-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: stop_test_stop_test__test_id__post");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── preview_step_preview_step_post ──
        let res_8 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/preview-step`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: preview_step_preview_step_post");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── discover_apis_discover_apis_post ──
        let res_9 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/discover-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: discover_apis_discover_apis_post");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── import_apis_import_apis_post ──
        let res_10 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/import-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: import_apis_import_apis_post");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

    }
}
