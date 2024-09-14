const http = require("http");
const port = 3000;
const hadlers = require("./handlers");

http
  .createServer((req, res) => {
    for (const handler of hadlers) {
      if (!handler(req, res)) {
        break;
      }
    }
  })
  .listen(port);
