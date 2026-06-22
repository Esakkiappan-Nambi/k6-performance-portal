
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 15,
    duration: '29s',
};

export default function () {
    http.request('POST', 'http://api.com/login');
http.get('http://api.com/products');
http.request('POST', 'http://api.com/cart');
http.request('POST', 'http://api.com/checkout');

    sleep(1);
}
