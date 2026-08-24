import http from "k6/http";
    import { check, sleep } from "k6";
    import { Trend, Counter, Rate } from "k6/metrics";
    

    const aggregateResponseTime = new Trend("aggregate_response_time", true);
    const aggregateErrors       = new Counter("aggregate_errors");
    const aggregateFailureRate  = new Rate("aggregate_failure_rate");

    
    // ── HTTP Cache Manager (JMeter equivalent) ────────────────────────────
    // Per-VU cache: url → { etag, lastModified }
    const __cache = {};
    let __cacheSize = 0;
    const __cacheMaxSize = 49;
    
    
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
            { duration: "2s", target: 1 },
            { duration: "10s", target: 1 },
            { duration: "5s", target: 0 },
        ],
    };

    export default function () {
        
        const variables = {};
        

        
        

        for (let i = 0; i < 2; i++) {
            // Cookie Manager disabled - clearing cookies each iteration
  
            
    // Clear cache each iteration (JMeter style)
    for (const key in __cache) {
        delete __cache[key];
    }
    __cacheSize = 0;
    
            
    
        }
    }
    