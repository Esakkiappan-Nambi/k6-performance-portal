import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";

const csvData = new SharedArray("csvData", function () {
    return open("C:/Users/Esakkiappan-Nambi/Pictures/Screenshots/K6-UI/Backend/uploads/Book 5(Sheet1).csv")
        .split("\n")
        .slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {
            const cols = line.split(",");
            return { email: cols[0], password: cols[1] };
        });
});


const aggregateResponseTime = new Trend("aggregate_response_time", true);
const aggregateErrors       = new Counter("aggregate_errors");
const aggregateFailureRate  = new Rate("aggregate_failure_rate");


    // ── HTTP Cache Manager (JMeter equivalent) ────────────────────────────
    // Per-VU cache: url → { etag, lastModified }
    const __cache = {};
    let __cacheSize = 0;
    const __cacheMaxSize = 75;
    

    // Returns conditional headers for a URL if cached
    function getCacheHeaders(url) {
        const entry = __cache[url];
        if (!entry) return {};

        const headers = {};

        if (entry.etag) {
            headers["If-None-Match"] = entry.etag;
        }

        if (entry.lastModified) {
            headers["If-Modified-Since"] = entry.lastModified;
        }

        return headers;
    }

    // Store cache metadata from response
    function storeCacheEntry(url, res) {
        const etag =
            res.headers["ETag"] ||
            res.headers["Etag"] ||
            null;

        const lastModified =
            res.headers["Last-Modified"] ||
            null;

        if (etag || lastModified) {
            if (!__cache[url] && __cacheSize >= __cacheMaxSize) {
                const oldest = Object.keys(__cache)[0];
                delete __cache[oldest];
                __cacheSize--;
            }

            if (!__cache[url]) {
                __cacheSize++;
            }

            __cache[url] = {
                etag: etag,
                lastModified: lastModified
            };
        }
    }
    

export const options = {
    stages: [
        { duration: "5s", target: 5 },
        { duration: "10s", target: 5 },
        { duration: "5s", target: 0 },
    ],
};

export default function () {
    
    const variables = {};
    const jar = http.cookieJar(); // HTTP Cookie Manager

    
    

    for (let i = 0; i < 1; i++) {
        // Clear cookies (JMeter: clear each iteration)
        jar.clear("https://demowebshop.tricentis.com");
        
    // Clear cache each iteration (JMeter style)
    for (const key in __cache) {
        delete __cache[key];
    }
    __cacheSize = 0;
    
        const data = csvData[(__VU - 1) % csvData.length];
    console.log("VU:", __VU, "User:", JSON.stringify(data));

        // ── GET root ──
        let res_0 = http.get(`https://demowebshop.tricentis.com/`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/`, res_0);

        console.log("Request: GET root");
        console.log("Status:", res_0.status);
        console.log("Body:", res_0.body);

        aggregateResponseTime.add(res_0.timings.duration);

        if (res_0.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        check(res_0, {
            "GET root status 200": (r) => r.status === 200,
            "GET root response time < 2000ms": (r) => r.timings.duration <= 2000
        });

        // ── POST subscribenewsletter ──
        let res_1 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/subscribenewsletter`,
            "email=",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST subscribenewsletter");
        console.log("Status:", res_1.status);
        console.log("Body:", res_1.body);

        aggregateResponseTime.add(res_1.timings.duration);

        if (res_1.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_2 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/2/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_2.status);
        console.log("Body:", res_2.body);

        aggregateResponseTime.add(res_2.timings.duration);

        if (res_2.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET 25-virtual-gift-card ──
        let res_3 = http.get(`https://demowebshop.tricentis.com/25-virtual-gift-card`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/25-virtual-gift-card`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/25-virtual-gift-card`, res_3);

        console.log("Request: GET 25-virtual-gift-card");
        console.log("Status:", res_3.status);
        console.log("Body:", res_3.body);

        aggregateResponseTime.add(res_3.timings.duration);

        if (res_3.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET productemailafriend / 2 ──
        let res_4 = http.get(`https://demowebshop.tricentis.com/productemailafriend/2`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/productemailafriend/2`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/productemailafriend/2`, res_4);

        console.log("Request: GET productemailafriend / 2");
        console.log("Status:", res_4.status);
        console.log("Body:", res_4.body);

        aggregateResponseTime.add(res_4.timings.duration);

        if (res_4.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET register ──
        let res_5 = http.get(`https://demowebshop.tricentis.com/register`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/register`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/register`, res_5);

        console.log("Request: GET register");
        console.log("Status:", res_5.status);
        console.log("Body:", res_5.body);

        aggregateResponseTime.add(res_5.timings.duration);

        if (res_5.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET login ──
        let res_6 = http.get(`https://demowebshop.tricentis.com/login`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/login`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/login`, res_6);

        console.log("Request: GET login");
        console.log("Status:", res_6.status);
        console.log("Body:", res_6.body);

        aggregateResponseTime.add(res_6.timings.duration);

        if (res_6.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST login ──
        let res_7 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/login`,
            "Email=&Password=&RememberMe=false",
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST login");
        console.log("Status:", res_7.status);
        console.log("Body:", res_7.body);

        aggregateResponseTime.add(res_7.timings.duration);

        if (res_7.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET cart ──
        let res_8 = http.get(`https://demowebshop.tricentis.com/cart`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/cart`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/cart`, res_8);

        console.log("Request: GET cart");
        console.log("Status:", res_8.status);
        console.log("Body:", res_8.body);

        aggregateResponseTime.add(res_8.timings.duration);

        if (res_8.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET wishlist ──
        let res_9 = http.get(`https://demowebshop.tricentis.com/wishlist`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/wishlist`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/wishlist`, res_9);

        console.log("Request: GET wishlist");
        console.log("Status:", res_9.status);
        console.log("Body:", res_9.body);

        aggregateResponseTime.add(res_9.timings.duration);

        if (res_9.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET books ──
        let res_10 = http.get(`https://demowebshop.tricentis.com/books`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/books`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/books`, res_10);

        console.log("Request: GET books");
        console.log("Status:", res_10.status);
        console.log("Body:", res_10.body);

        aggregateResponseTime.add(res_10.timings.duration);

        if (res_10.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_11 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/13/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_11.status);
        console.log("Body:", res_11.body);

        aggregateResponseTime.add(res_11.timings.duration);

        if (res_11.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_12 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/45/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_12.status);
        console.log("Body:", res_12.body);

        aggregateResponseTime.add(res_12.timings.duration);

        if (res_12.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_13 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/22/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_13.status);
        console.log("Body:", res_13.body);

        aggregateResponseTime.add(res_13.timings.duration);

        if (res_13.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET computers ──
        let res_14 = http.get(`https://demowebshop.tricentis.com/computers`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/computers`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/computers`, res_14);

        console.log("Request: GET computers");
        console.log("Status:", res_14.status);
        console.log("Body:", res_14.body);

        aggregateResponseTime.add(res_14.timings.duration);

        if (res_14.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET desktops ──
        let res_15 = http.get(`https://demowebshop.tricentis.com/desktops`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/desktops`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/desktops`, res_15);

        console.log("Request: GET desktops");
        console.log("Status:", res_15.status);
        console.log("Body:", res_15.body);

        aggregateResponseTime.add(res_15.timings.duration);

        if (res_15.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_16 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/72/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_16.status);
        console.log("Body:", res_16.body);

        aggregateResponseTime.add(res_16.timings.duration);

        if (res_16.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET build-your-cheap-own-computer ──
        let res_17 = http.get(`https://demowebshop.tricentis.com/build-your-cheap-own-computer`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/build-your-cheap-own-computer`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/build-your-cheap-own-computer`, res_17);

        console.log("Request: GET build-your-cheap-own-computer");
        console.log("Status:", res_17.status);
        console.log("Body:", res_17.body);

        aggregateResponseTime.add(res_17.timings.duration);

        if (res_17.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET notebooks ──
        let res_18 = http.get(`https://demowebshop.tricentis.com/notebooks`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/notebooks`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/notebooks`, res_18);

        console.log("Request: GET notebooks");
        console.log("Status:", res_18.status);
        console.log("Body:", res_18.body);

        aggregateResponseTime.add(res_18.timings.duration);

        if (res_18.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_19 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/31/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_19.status);
        console.log("Body:", res_19.body);

        aggregateResponseTime.add(res_19.timings.duration);

        if (res_19.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET accessories ──
        let res_20 = http.get(`https://demowebshop.tricentis.com/accessories`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/accessories`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/accessories`, res_20);

        console.log("Request: GET accessories");
        console.log("Status:", res_20.status);
        console.log("Body:", res_20.body);

        aggregateResponseTime.add(res_20.timings.duration);

        if (res_20.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── POST 1 / 1 ──
        let res_21 = http.request(
            "POST",
            `https://demowebshop.tricentis.com/addproducttocart/catalog/63/1/1`,
            JSON.stringify({

}),
            { headers: {
  "Content-Type": "application/json"
} }
        );

        console.log("Request: POST 1 / 1");
        console.log("Status:", res_21.status);
        console.log("Body:", res_21.body);

        aggregateResponseTime.add(res_21.timings.duration);

        if (res_21.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET copy-of-copy-of-tcp-self-paced-training ──
        let res_22 = http.get(`https://demowebshop.tricentis.com/copy-of-copy-of-tcp-self-paced-training`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/copy-of-copy-of-tcp-self-paced-training`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/copy-of-copy-of-tcp-self-paced-training`, res_22);

        console.log("Request: GET copy-of-copy-of-tcp-self-paced-training");
        console.log("Status:", res_22.status);
        console.log("Body:", res_22.body);

        aggregateResponseTime.add(res_22.timings.duration);

        if (res_22.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET productemailafriend / 63 ──
        let res_23 = http.get(`https://demowebshop.tricentis.com/productemailafriend/63`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/productemailafriend/63`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/productemailafriend/63`, res_23);

        console.log("Request: GET productemailafriend / 63");
        console.log("Status:", res_23.status);
        console.log("Body:", res_23.body);

        aggregateResponseTime.add(res_23.timings.duration);

        if (res_23.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET electronics ──
        let res_24 = http.get(`https://demowebshop.tricentis.com/electronics`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/electronics`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/electronics`, res_24);

        console.log("Request: GET electronics");
        console.log("Status:", res_24.status);
        console.log("Body:", res_24.body);

        aggregateResponseTime.add(res_24.timings.duration);

        if (res_24.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

        // ── GET camera-photo ──
        let res_25 = http.get(`https://demowebshop.tricentis.com/camera-photo`, {
                headers: {
                    ...{},
                    ...getCacheHeaders(`https://demowebshop.tricentis.com/camera-photo`)
                }
            });

        storeCacheEntry(`https://demowebshop.tricentis.com/camera-photo`, res_25);

        console.log("Request: GET camera-photo");
        console.log("Status:", res_25.status);
        console.log("Body:", res_25.body);

        aggregateResponseTime.add(res_25.timings.duration);

        if (res_25.status >= 400) {
            aggregateErrors.add(1);
            aggregateFailureRate.add(true);
        } else {
            aggregateFailureRate.add(false);
        }

    }
}
