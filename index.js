const cheerio = require("cheerio");
const express = require("express");
const fetch = require("isomorphic-fetch");
const path = require("path");
const fs = require("fs-extra");
const tempy = require("tempy");
const cors = require("cors");

const app = express();
const port = 8080;

app.use(cors());
app.get("/", async (req, res) => {
  try {
    if (req.query.artist) {
      return res.redirect(await getImage(req.query.artist));
    }
    res.send(`
  <form>
    <input name="artist" />
  </form>
`);
  } catch (error) {
    res.send({ error });
  }
});

const cacheFolder = tempy.directory();

async function getImage(artist) {
  let result = "";
  const cacheFile = path.join(cacheFolder, artist);
  if (await fs.exists(cacheFile)) {
    console.log("cached", artist);
    return (await fs.readFile(cacheFile)).toString();
  } else {
    console.log("not cached", artist);
    const request = await fetch(`https://www.last.fm/music/${artist}/+images`);
    const text = await request.text();
    const $ = cheerio.load(text);

    result = String(
      Array.from($(".image-list-item-wrapper img")).map(
        e => e.attribs.src
      )[0] || "/"
    ).replace("avatar170", "avatar600");
    fs.writeFile(cacheFile, result);
  }
  return result;
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
