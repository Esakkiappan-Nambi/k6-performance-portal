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

        // ── verify_token_verify_token_get ──
        let res_5 = http.get(`https://daisy-exception-slain.ngrok-free.dev/verify-token`, {
            headers: {},
            
        });

        console.log("Request: verify_token_verify_token_get");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── create_test_create_test_post ──
        let res_6 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/create-test`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: create_test_create_test_post");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_test_by_id_test__test_id__get ──
        let res_7 = http.get(`https://daisy-exception-slain.ngrok-free.dev/test/{{test_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_test_by_id_test__test_id__get");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── update_test_update_test__test_id__put ──
        let res_8 = http.request(
        "PUT",
        `https://daisy-exception-slain.ngrok-free.dev/update-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: update_test_update_test__test_id__put");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── delete_test_delete_test__test_id__delete ──
        let res_9 = http.request(
        "DELETE",
        `https://daisy-exception-slain.ngrok-free.dev/delete-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: delete_test_delete_test__test_id__delete");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── run_test_run_test__test_id__post ──
        let res_10 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/run-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: run_test_run_test__test_id__post");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── stop_test_stop_test__test_id__post ──
        let res_11 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/stop-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: stop_test_stop_test__test_id__post");
        console.log("Status:", res_11.status);
        console.log("Body:", res_11.body);

        aggregateResponseTime.add(res_11.timings.duration);

        if (res_11.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_tests_tests_get ──
        let res_12 = http.get(`https://daisy-exception-slain.ngrok-free.dev/tests`, {
            headers: {},
            
        });

        console.log("Request: get_tests_tests_get");
        console.log("Status:", res_12.status);
        console.log("Body:", res_12.body);

        aggregateResponseTime.add(res_12.timings.duration);

        if (res_12.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_test_runs_test_runs_get ──
        let res_13 = http.get(`https://daisy-exception-slain.ngrok-free.dev/test-runs`, {
            headers: {},
            
        });

        console.log("Request: get_test_runs_test_runs_get");
        console.log("Status:", res_13.status);
        console.log("Body:", res_13.body);

        aggregateResponseTime.add(res_13.timings.duration);

        if (res_13.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_report_report__run_id__get ──
        let res_14 = http.get(`https://daisy-exception-slain.ngrok-free.dev/report/{{run_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_report_report__run_id__get");
        console.log("Status:", res_14.status);
        console.log("Body:", res_14.body);

        aggregateResponseTime.add(res_14.timings.duration);

        if (res_14.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_latest_run_latest_run__test_id__get ──
        let res_15 = http.get(`https://daisy-exception-slain.ngrok-free.dev/latest-run/{{test_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_latest_run_latest_run__test_id__get");
        console.log("Status:", res_15.status);
        console.log("Body:", res_15.body);

        aggregateResponseTime.add(res_15.timings.duration);

        if (res_15.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_reports_reports_get ──
        let res_16 = http.get(`https://daisy-exception-slain.ngrok-free.dev/reports`, {
            headers: {},
            
        });

        console.log("Request: get_reports_reports_get");
        console.log("Status:", res_16.status);
        console.log("Body:", res_16.body);

        aggregateResponseTime.add(res_16.timings.duration);

        if (res_16.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── preview_step_preview_step_post ──
        let res_17 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/preview-step`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: preview_step_preview_step_post");
        console.log("Status:", res_17.status);
        console.log("Body:", res_17.body);

        aggregateResponseTime.add(res_17.timings.duration);

        if (res_17.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── discover_apis_discover_apis_post ──
        let res_18 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/discover-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: discover_apis_discover_apis_post");
        console.log("Status:", res_18.status);
        console.log("Body:", res_18.body);

        aggregateResponseTime.add(res_18.timings.duration);

        if (res_18.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── import_apis_import_apis_post ──
        let res_19 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/import-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: import_apis_import_apis_post");
        console.log("Status:", res_19.status);
        console.log("Body:", res_19.body);

        aggregateResponseTime.add(res_19.timings.duration);

        if (res_19.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── dashboard_stats_dashboard_stats_get ──
        let res_20 = http.get(`https://daisy-exception-slain.ngrok-free.dev/dashboard-stats`, {
            headers: {},
            
        });

        console.log("Request: dashboard_stats_dashboard_stats_get");
        console.log("Status:", res_20.status);
        console.log("Body:", res_20.body);

        aggregateResponseTime.add(res_20.timings.duration);

        if (res_20.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── recent_tests_recent_tests_get ──
        let res_21 = http.get(`https://daisy-exception-slain.ngrok-free.dev/recent-tests`, {
            headers: {},
            
        });

        console.log("Request: recent_tests_recent_tests_get");
        console.log("Status:", res_21.status);
        console.log("Body:", res_21.body);

        aggregateResponseTime.add(res_21.timings.duration);

        if (res_21.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── execution_chart_execution_chart_get ──
        let res_22 = http.get(`https://daisy-exception-slain.ngrok-free.dev/execution-chart`, {
            headers: {},
            
        });

        console.log("Request: execution_chart_execution_chart_get");
        console.log("Status:", res_22.status);
        console.log("Body:", res_22.body);

        aggregateResponseTime.add(res_22.timings.duration);

        if (res_22.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── delete_run_delete_run__run_id__delete ──
        let res_23 = http.request(
        "DELETE",
        `https://daisy-exception-slain.ngrok-free.dev/delete-run/{{run_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: delete_run_delete_run__run_id__delete");
        console.log("Status:", res_23.status);
        console.log("Body:", res_23.body);

        aggregateResponseTime.add(res_23.timings.duration);

        if (res_23.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── download_report_download_report__run_id__get ──
        let res_24 = http.get(`https://daisy-exception-slain.ngrok-free.dev/download-report/{{run_id}}`, {
            headers: {},
            
        });

        console.log("Request: download_report_download_report__run_id__get");
        console.log("Status:", res_24.status);
        console.log("Body:", res_24.body);

        aggregateResponseTime.add(res_24.timings.duration);

        if (res_24.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── auto_capture_auto_capture_post ──
        let res_25 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/auto-capture`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auto_capture_auto_capture_post");
        console.log("Status:", res_25.status);
        console.log("Body:", res_25.body);

        aggregateResponseTime.add(res_25.timings.duration);

        if (res_25.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── auth_capture_endpoint_authenticated_capture_post ──
        let res_26 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/authenticated-capture`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auth_capture_endpoint_authenticated_capture_post");
        console.log("Status:", res_26.status);
        console.log("Body:", res_26.body);

        aggregateResponseTime.add(res_26.timings.duration);

        if (res_26.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── auto_generate_auto_generate_post ──
        let res_27 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/auto-generate`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: auto_generate_auto_generate_post");
        console.log("Status:", res_27.status);
        console.log("Body:", res_27.body);

        aggregateResponseTime.add(res_27.timings.duration);

        if (res_27.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── register_user_register_post ──
        let res_28 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/register`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: register_user_register_post");
        console.log("Status:", res_28.status);
        console.log("Body:", res_28.body);

        aggregateResponseTime.add(res_28.timings.duration);

        if (res_28.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── login_user_login_post ──
        let res_29 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/login`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: login_user_login_post");
        console.log("Status:", res_29.status);
        console.log("Body:", res_29.body);

        aggregateResponseTime.add(res_29.timings.duration);

        if (res_29.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── verify_token_verify_token_get ──
        let res_30 = http.get(`https://daisy-exception-slain.ngrok-free.dev/verify-token`, {
            headers: {},
            
        });

        console.log("Request: verify_token_verify_token_get");
        console.log("Status:", res_30.status);
        console.log("Body:", res_30.body);

        aggregateResponseTime.add(res_30.timings.duration);

        if (res_30.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── create_test_create_test_post ──
        let res_31 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/create-test`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: create_test_create_test_post");
        console.log("Status:", res_31.status);
        console.log("Body:", res_31.body);

        aggregateResponseTime.add(res_31.timings.duration);

        if (res_31.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_test_by_id_test__test_id__get ──
        let res_32 = http.get(`https://daisy-exception-slain.ngrok-free.dev/test/{{test_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_test_by_id_test__test_id__get");
        console.log("Status:", res_32.status);
        console.log("Body:", res_32.body);

        aggregateResponseTime.add(res_32.timings.duration);

        if (res_32.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── update_test_update_test__test_id__put ──
        let res_33 = http.request(
        "PUT",
        `https://daisy-exception-slain.ngrok-free.dev/update-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: update_test_update_test__test_id__put");
        console.log("Status:", res_33.status);
        console.log("Body:", res_33.body);

        aggregateResponseTime.add(res_33.timings.duration);

        if (res_33.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── delete_test_delete_test__test_id__delete ──
        let res_34 = http.request(
        "DELETE",
        `https://daisy-exception-slain.ngrok-free.dev/delete-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: delete_test_delete_test__test_id__delete");
        console.log("Status:", res_34.status);
        console.log("Body:", res_34.body);

        aggregateResponseTime.add(res_34.timings.duration);

        if (res_34.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── run_test_run_test__test_id__post ──
        let res_35 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/run-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: run_test_run_test__test_id__post");
        console.log("Status:", res_35.status);
        console.log("Body:", res_35.body);

        aggregateResponseTime.add(res_35.timings.duration);

        if (res_35.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── stop_test_stop_test__test_id__post ──
        let res_36 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/stop-test/{{test_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: stop_test_stop_test__test_id__post");
        console.log("Status:", res_36.status);
        console.log("Body:", res_36.body);

        aggregateResponseTime.add(res_36.timings.duration);

        if (res_36.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_tests_tests_get ──
        let res_37 = http.get(`https://daisy-exception-slain.ngrok-free.dev/tests`, {
            headers: {},
            
        });

        console.log("Request: get_tests_tests_get");
        console.log("Status:", res_37.status);
        console.log("Body:", res_37.body);

        aggregateResponseTime.add(res_37.timings.duration);

        if (res_37.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_test_runs_test_runs_get ──
        let res_38 = http.get(`https://daisy-exception-slain.ngrok-free.dev/test-runs`, {
            headers: {},
            
        });

        console.log("Request: get_test_runs_test_runs_get");
        console.log("Status:", res_38.status);
        console.log("Body:", res_38.body);

        aggregateResponseTime.add(res_38.timings.duration);

        if (res_38.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_report_report__run_id__get ──
        let res_39 = http.get(`https://daisy-exception-slain.ngrok-free.dev/report/{{run_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_report_report__run_id__get");
        console.log("Status:", res_39.status);
        console.log("Body:", res_39.body);

        aggregateResponseTime.add(res_39.timings.duration);

        if (res_39.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_latest_run_latest_run__test_id__get ──
        let res_40 = http.get(`https://daisy-exception-slain.ngrok-free.dev/latest-run/{{test_id}}`, {
            headers: {},
            
        });

        console.log("Request: get_latest_run_latest_run__test_id__get");
        console.log("Status:", res_40.status);
        console.log("Body:", res_40.body);

        aggregateResponseTime.add(res_40.timings.duration);

        if (res_40.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── get_reports_reports_get ──
        let res_41 = http.get(`https://daisy-exception-slain.ngrok-free.dev/reports`, {
            headers: {},
            
        });

        console.log("Request: get_reports_reports_get");
        console.log("Status:", res_41.status);
        console.log("Body:", res_41.body);

        aggregateResponseTime.add(res_41.timings.duration);

        if (res_41.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── preview_step_preview_step_post ──
        let res_42 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/preview-step`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: preview_step_preview_step_post");
        console.log("Status:", res_42.status);
        console.log("Body:", res_42.body);

        aggregateResponseTime.add(res_42.timings.duration);

        if (res_42.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── discover_apis_discover_apis_post ──
        let res_43 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/discover-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: discover_apis_discover_apis_post");
        console.log("Status:", res_43.status);
        console.log("Body:", res_43.body);

        aggregateResponseTime.add(res_43.timings.duration);

        if (res_43.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── import_apis_import_apis_post ──
        let res_44 = http.request(
        "POST",
        `https://daisy-exception-slain.ngrok-free.dev/import-apis`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: import_apis_import_apis_post");
        console.log("Status:", res_44.status);
        console.log("Body:", res_44.body);

        aggregateResponseTime.add(res_44.timings.duration);

        if (res_44.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── dashboard_stats_dashboard_stats_get ──
        let res_45 = http.get(`https://daisy-exception-slain.ngrok-free.dev/dashboard-stats`, {
            headers: {},
            
        });

        console.log("Request: dashboard_stats_dashboard_stats_get");
        console.log("Status:", res_45.status);
        console.log("Body:", res_45.body);

        aggregateResponseTime.add(res_45.timings.duration);

        if (res_45.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── recent_tests_recent_tests_get ──
        let res_46 = http.get(`https://daisy-exception-slain.ngrok-free.dev/recent-tests`, {
            headers: {},
            
        });

        console.log("Request: recent_tests_recent_tests_get");
        console.log("Status:", res_46.status);
        console.log("Body:", res_46.body);

        aggregateResponseTime.add(res_46.timings.duration);

        if (res_46.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── execution_chart_execution_chart_get ──
        let res_47 = http.get(`https://daisy-exception-slain.ngrok-free.dev/execution-chart`, {
            headers: {},
            
        });

        console.log("Request: execution_chart_execution_chart_get");
        console.log("Status:", res_47.status);
        console.log("Body:", res_47.body);

        aggregateResponseTime.add(res_47.timings.duration);

        if (res_47.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── delete_run_delete_run__run_id__delete ──
        let res_48 = http.request(
        "DELETE",
        `https://daisy-exception-slain.ngrok-free.dev/delete-run/{{run_id}}`,
        JSON.stringify({

}),
        { headers: {
  "Content-Type": "application/json"
},  }
    );

        console.log("Request: delete_run_delete_run__run_id__delete");
        console.log("Status:", res_48.status);
        console.log("Body:", res_48.body);

        aggregateResponseTime.add(res_48.timings.duration);

        if (res_48.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── download_report_download_report__run_id__get ──
        let res_49 = http.get(`https://daisy-exception-slain.ngrok-free.dev/download-report/{{run_id}}`, {
            headers: {},
            
        });

        console.log("Request: download_report_download_report__run_id__get");
        console.log("Status:", res_49.status);
        console.log("Body:", res_49.body);

        aggregateResponseTime.add(res_49.timings.duration);

        if (res_49.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

    }
}
