
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 100,
    duration: '58s',
};

export default function () {

    
http.request(
    'POST',
    'https://google.com'
);


    sleep(1);
}
