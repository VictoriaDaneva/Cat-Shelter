const fs = require("fs");
const url = require("url");

function getContentType(url) {
  if (url.endsWith(".css")) {
    return "text/css";
  } else if (url.endsWith(".html")) {
    return "text/html";
  } else if (url.endsWith(".js")) {
    return "text/javascript";
  } else if (url.endsWith(".txt")) {
    return "text/plain";
  } else if (url.endsWith(".json")) {
    return "application/json";
  } else if (url.endsWith(".ico")) {
    return "image/vnd.microsoft.icon";
  } else if (url.endsWith(".png")) {
    return "image/png";
  } else if (url.endsWith(".gif")) {
    return "image/gif";
  } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
}

module.exports = (req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname.startsWith("/content") && req.method === "GET") {
    if (
      pathname.endsWith("png") ||
      pathname.endsWith("jpg") ||
      pathname.endsWith("jpeg") ||
      (pathname.endsWith("ico") && req.method === "GET")
    ) {
      fs.readFile(`./${pathname}`, (err, data) => {
        if (err) {
          console.log(err);
          res.writeHead(404, {
            "Content-Type": "text/plain",
          });

          res.write("Error was found >: (");
          res.end();
          return;
        }

        res.writeHead(200, {
          "Content-Type": getContentType(pathname),
        });
        res.write(data);
        res.end();
      });
    } else {
      fs.readFile(`./${pathname}`, "utf8", (err, data) => {
        if (err) {
          console.log(err);
          res.writeHead(404, {
            "Content-Type": "text/plain",
          });

          res.write("Error was found >: (");
          res.end();
          return;
        }

        res.writeHead(200, {
          "Content-Type": getContentType(pathname),
        });
        res.write(data);
        res.end();
      });
    }
  } else {
    return true;
  }
};
