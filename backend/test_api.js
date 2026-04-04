const http = require('http');

http.get('http://localhost:5000/api/hotels/districts', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
