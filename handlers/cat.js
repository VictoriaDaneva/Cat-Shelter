const url = require("url");
const fs = require("fs");
const qs = require("querystring");
const path = require("path");
const cats = require("../data/cats.json");

module.exports = (req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === "/cats/add-cat" && req.method === "GET") {
    let filePath = path.normalize(path.join(__dirname, "../views/addCat.html"));

    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        console.log(err);
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.write("404 not found :(");
        res.end();
        return;
      }

      fs.readFile("./data/breeds.json", "utf-8", (err, breedsData) => {
        if (err) {
          console.log(err);
          res.writeHead(500, {
            "Content-Type": "text/plain",
          });

          res.write("Internal server error");
          res.end();
          return;
        }

        const breeds = JSON.parse(breedsData);
        const breedOptions = breeds
          .map((breed) => `<option value="${breed}">${breed}</option>`)
          .join("\n");

        const finalHtml = data.replace("{{catBreeds}}", breedOptions);

        res.writeHead(200, {
          "Content-Type": "text/html",
        });

        res.write(finalHtml);
        res.end();
      });
    });
  } else if (pathname === "/cats/add-breed" && req.method === "GET") {
    let filePath = path.normalize(
      path.join(__dirname, "../views/addBreed.html")
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

      res.write(data);
      res.end();
    });
  } else if (pathname === "/cats/add-cat" && req.method === "POST") {
    const boundary = req.headers["content-type"]
      .split("; ")[1]
      .replace("boundary=", "");
    let body = "";

    // Listen for the data event to collect incoming chunks
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Once all the data has been collected
    req.on("end", () => {
      // Split the data by boundary
      const parts = body.split(`--${boundary}`);

      let newCat = {}; // Object to store new cat data

      parts.forEach((part) => {
        if (part.includes("Content-Disposition: form-data")) {
          // Check if part contains a file
          if (part.includes("filename=")) {
            // Extract file data
            const fileNameMatch = part.match(/filename="(.+?)"/);
            const contentTypeMatch = part.match(/Content-Type: (.+)/);

            if (fileNameMatch && contentTypeMatch) {
              const fileName = fileNameMatch[1];
              const contentType = contentTypeMatch[1];

              // Find the file data start and end positions
              const fileDataStart =
                part.indexOf(contentType) + contentType.length + 4; // Skip two CRLFs
              const fileDataEnd = part.indexOf(`\r\n--`);

              const fileData = part
                .substring(fileDataStart, fileDataEnd)
                .trim();

              // Save file to disk
              const filePath = path.join(
                __dirname,
                "../content/images",
                fileName
              );
              fs.writeFile(filePath, fileData, "binary", (err) => {
                if (err) {
                  console.error("Failed to save file", err);
                  res.writeHead(500, { "Content-Type": "text/plain" });
                  res.write("Internal server error");
                  res.end();
                  return;
                }

                console.log(`File ${fileName} saved successfully.`);
                newCat.image = fileName; // Save file name to new cat object
              });
            }
          } else {
            // Handle form fields (e.g., name, description, breed, etc.)
            const fieldNameMatch = part.match(/name="(.+?)"/);
            const fieldValue = part.split("\r\n\r\n")[1]?.trim();

            if (fieldNameMatch) {
              const fieldName = fieldNameMatch[1];
              newCat[fieldName] = fieldValue; // Add form field to the new cat object
            }
          }
        }
      });

      // Read the existing cats from cats.json
      const catsFilePath = path.normalize(
        path.join(__dirname, "../data/cats.json")
      );

      fs.readFile(catsFilePath, "utf-8", (err, data) => {
        if (err) {
          console.error(err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.write("Failed to read the cats file");
          res.end();
          return;
        }

        let allCats = JSON.parse(data);

        // Add the new cat object with a unique ID
        newCat.id = allCats.length + 1;
        allCats.push(newCat);

        // Save the updated cats array to cats.json
        const json = JSON.stringify(allCats, null, 2); // Pretty print JSON

        fs.writeFile(catsFilePath, json, "utf-8", (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.write("Error saving the new cat data");
            res.end();
            return;
          }

          // Redirect the user back to the home page after successful submission
          res.writeHead(302, { location: "/" });
          res.end();
        });
      });
    });

    // Error handling
    req.on("error", (err) => {
      console.error("Error handling the upload request", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write("Internal server error");
      res.end();
    });
  } else if (pathname === "/cats/add-breed" && req.method === "POST") {
    let filePath = path.normalize(path.join(__dirname, "../data/breeds.json"));
    let formData = "";

    req.on("data", (data) => {
      formData += data;
    });

    req.on("end", () => {
      let body = qs.parse(formData);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          throw err;
        }

        let breeds = JSON.parse(data);
        breeds.push(body.breed);
        let json = JSON.stringify(breeds);

        fs.writeFile(filePath, json, "utf-8", () =>
          console.log("The breed was uploaded successfully!")
        );
      });

      res.writeHead(302, { location: "/" });
      res.end();
    });
  } else if (pathname.includes("/cats-edit") && req.method === "GET") {
    let catId = pathname.split("/cats-edit/")[1];
    let filepath = path.normalize(
      path.join(__dirname, "../views/editCat.html")
    );

    fs.readFile(filepath, (err, data) => {
      if (err) {
        console.log(err);
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.write("404 not found :(");
        res.end();
        return;
      }

      const cat = cats.find((cat) => cat.id == catId);

      fs.readFile("./data/breeds.json", "utf-8", (err, breedsData) => {
        if (err) {
          console.log(err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.write("Internal server error");
          res.end();
          return;
        }

        const breeds = JSON.parse(breedsData);
        const breedOptions = breeds
          .map((breed) =>
            breed === cat.breed
              ? `<option value="${breed}" selected>${breed}</option>`
              : `<option value="${breed}">${breed}</option>`
          )
          .join("\n");

        let finalHtml = data.toString().replace("{{id}}", catId);
        finalHtml = finalHtml.replace("{{name}}", cat.name);
        finalHtml = finalHtml.replace("{{description}}", cat.description);
        finalHtml = finalHtml.replace("{{catBreeds}}", breedOptions);
        finalHtml = finalHtml.replace(
          "{{image}}",
          `/content/images/${cat.image}`
        );

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(finalHtml);
        res.end();
      });
    });
  } else if (pathname.includes("/cat-find-new-home") && req.method === "GET") {
    let catId = pathname.split("/cat-find-new-home/")[1];
    let filepath = path.normalize(
      path.join(__dirname, "../views/catShelter.html")
    );

    fs.readFile(filepath, (err, data) => {
      if (err) {
        console.log(err);
        res.writeHead(404, {
          "Content-Type": "text/plain",
        });

        res.write("404 not found :(");
        res.end();
        return;
      }

      const cat = cats.find((cat) => cat.id == catId);

      fs.readFile("./data/breeds.json", "utf-8", (err, breedsData) => {
        if (err) {
          console.log(err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.write("Internal server error");
          res.end();
          return;
        }

        const breeds = JSON.parse(breedsData);
        const breedOptions = breeds
          .map((breed) =>
            breed === cat.breed
              ? `<option value="${breed}" selected>${breed}</option>`
              : `<option value="${breed}">${breed}</option>`
          )
          .join("\n");

        let finalHtml = data.toString().replace("{{id}}", catId);
        finalHtml = finalHtml.replace("{{name}}", cat.name);
        finalHtml = finalHtml.replace("{{description}}", cat.description);
        finalHtml = finalHtml.replace("{{catBreeds}}", breedOptions);
        finalHtml = finalHtml.replace(
          "{{image}}",
          `/content/images/${cat.image}`
        );

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(finalHtml);
        res.end();
      });
    });
  } else if (pathname.includes("/cats-edit") && req.method === "POST") {
    const catId = pathname.split("/cats-edit/")[1];
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const formData = qs.parse(body);
      let catIndex = cats.findIndex((cat) => cat.id == catId);
      catIndex = Number(catIndex);

      cats[catIndex].name = formData.name;
      cats[catIndex].description = formData.description;
      cats[catIndex].breed = formData.breed;

      const json = JSON.stringify(cats);
      fs.writeFile(
        path.join(__dirname, "../data/cats.json"),
        json,
        "utf-8",
        (err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.write("Failed to save the updated cat data");
            res.end();
            return;
          }

          res.writeHead(302, { location: "/" });
          res.end();
        }
      );
    });
  } else if (pathname.includes("/cat-find-new-home") && req.method === "POST") {
    const catId = pathname.split("/cat-find-new-home/")[1];

    const catIndex = cats.findIndex((cat) => cat.id == catId);

    const removedCat = cats.splice(catIndex, 1)[0];

    if (removedCat && removedCat.image) {
      const imagePath = path.join(
        __dirname,
        "../content/images",
        removedCat.image
      );
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err);
        } else {
          console.log(`Image ${removedCat.image} deleted successfully.`);
        }
      });
    }

    const json = JSON.stringify(cats);

    fs.writeFile(
      path.join(__dirname, "../data/cats.json"),
      json,
      "utf-8",
      (err) => {
        if (err) {
          console.error("Failed to save updated cats.json:", err);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.write("Failed to delete the cat");
          res.end();
          return;
        }

        res.writeHead(302, { location: "/" });
        res.end();
      }
    );
  } else {
    true;
  }
};
