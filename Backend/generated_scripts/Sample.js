
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {

    stages: [

        {
            duration: '15s',
            target: 20
        },

        {
            duration: '10s',
            target: 20
        },

        {
            duration: '10s',
            target: 0
        }
    ]
};

export default function () {

    for(let i=0;i<2;i++) {

        
    http.get('demowebshop.tricentis.com');

    http.request(
        'POST',
        'https://demowebshop.tricentis.com/login'
    );


        sleep(1);
    }
}
