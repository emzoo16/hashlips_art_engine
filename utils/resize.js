"use-strict";

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const { exit } = require("process");

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);

const target_width = 1080;
const target_height = 1080;

const originalLayersDir = `${basePath}/layers`;
const resizedLayersDir = `${basePath}/resized`;

const resizeAndSave = async (image_path, output_path) => {
  console.log(`resizing and saving ${image_path} to ${output_path}`);
  const canvas = createCanvas(target_width, target_height);
  const ctx = canvas.getContext("2d");
  await loadImage(image_path).then((image) => {
    ctx.drawImage(image, 0, 0, target_width, target_height);
  });

  fs.writeFileSync(output_path, canvas.toBuffer("image/png"));
};

fs.mkdirSync(resizedLayersDir);

const layers = fs.readdirSync(originalLayersDir);

layers.forEach(function (layerDir, index) {
  if (!fs.lstatSync(`${originalLayersDir}/${layerDir}`).isDirectory()) {
    return;
  }
  const layerDirFullPath = `${originalLayersDir}/${layerDir}`;
  const resizedDirFullPath = `${resizedLayersDir}/${layerDir}`;

  fs.mkdirSync(resizedDirFullPath);
  const layerImages = fs.readdirSync(layerDirFullPath);

  layerImages.forEach(function (layerImage, index) {
    resizeAndSave(
      `${layerDirFullPath}/${layerImage}`,
      `${resizedDirFullPath}/${layerImage}`
    );
  });
});
