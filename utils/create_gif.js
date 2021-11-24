"use-strict";

const Canvas = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);

const gifImagesDirectory = `${basePath}/gifImages`;
const gifFileName = `${gifImagesDirectory}/blob_outline.gif`;

const width = 1080;
const height = 1080;

const addImageToGif = (fileName) => {
  var data = fs.readFileSync(`${gifImagesDirectory}/${fileName}`);
  var img = new Canvas.Image();
  img.src = data;
  ctx.drawImage(img, 0, 0, width, height);
  encoder.addFrame(ctx);
};

var encoder = new GIFEncoder(width, height);

encoder.createReadStream().pipe(fs.createWriteStream(gifFileName));

encoder.start();
encoder.setRepeat(0);
encoder.setDelay(500);
encoder.setQuality(10);

var canvas = Canvas.createCanvas(width, height);
var ctx = canvas.getContext("2d");

const gifImages = fs.readdirSync(gifImagesDirectory);

gifImages.forEach(function (image, index) {
  if (image.endsWith(".png")) {
    addImageToGif(image);
  }
});

encoder.finish();
