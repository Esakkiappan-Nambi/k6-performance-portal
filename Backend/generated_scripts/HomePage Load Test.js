
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 20,
    duration: '10s',
};

export default function () {
    http.get('https://demowebshop.tricentis.com/');
http.get('https://demowebshop.tricentis.com/');
http.get('https://demowebshop.tricentis.com/books');
http.get('https://demowebshop.tricentis.com/computers');
http.get('https://demowebshop.tricentis.com/electronics');
http.get('https://demowebshop.tricentis.com/login');
http.request('POST', 'https://demowebshop.tricentis.com/login');
http.get('https://demowebshop.tricentis.com/141-inch-laptop');
http.request('POST', 'https://demowebshop.tricentis.com/addproducttocart/details/31/1');
http.get('https://demowebshop.tricentis.com/cart');

    sleep(1);
}
