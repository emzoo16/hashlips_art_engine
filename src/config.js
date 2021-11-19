"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { MODE } = require(path.join(basePath, "constants/blend_mode.js"));
const description = "Test test";
const baseUri = "ipfs://NewUriToReplace";

const layerConfigurations = [
  {
    growEditionSizeTo: 100,
    layersOrder: [
      { name: "Background" },
      { name: "Skin" },
      { name: "Face" },
      { name: "Eyes" },
      // { name: "Shine" },
      // { name: "Bottom lid" },
      // { name: "Top lid" },
    ],
  },
];

const format = {
  width: 1080,
  height: 1080,
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const encodeImage = true;

const checkpoint = 50;

const maxNumPerJsonFile = 50;

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.width / format.height,
  imageName: "preview.png",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  extraMetadata,
  pixelFormat,
  encodeImage,
  maxNumPerJsonFile,
  checkpoint,
};
