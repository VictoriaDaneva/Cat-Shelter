const url = require("url");
const fs = require("fs");
const path = require("path");
const cats = require("../data/cats.json");

module.exports = (req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === "/" && req.method === "GET") {
    let filePath = path.normalize(
      path.join(__dirname, "../views/home/index.html")
    );

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(err);
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.write("404 not found :(");
        res.end();
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html",
      });

      let modifyedCats = cats.map(
        (cat) => `<li>
      <img
        src="${path.join("./content/images/" + cat.image)}"
        alt="${cat.name}"
      />
      <h3>${cat.name}</h3>
      <p><span>Breed: </span>${cat.breed}</p>
      <p>
        <span>Description: </span> ${cat.description}
      </p>
      <ul class="buttons">
        <li class="btn edit"><a href="/cats-edit/${cat.id}">Change Info</a></li>
        <li class="btn delete"><a href="/cat-find-new-home/${
          cat.id
        }">New Home</a></li>
      </ul>
    </li>
    <li>`
      );
      let modifyedData = data.toString().replace("{{cats}}", modifyedCats);

      res.write(modifyedData);
      res.end();
    });
  } else {
    return true;
  }
};
