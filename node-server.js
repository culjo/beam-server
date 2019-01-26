// A test of how the normal node server works

const http = require('http');
const port = 3001;
const server = http.createServer();

server.on('request', (request, response) => {
    console.log(`URL: ${request.url}`);
    response.end('Hello Serve Lekan');
});

// Start the server
server.listen(port, (error) => {
    if (error) return console.log(`Error: ${error}`)
    console.log(`Server is listening on port ${port}`)
})

