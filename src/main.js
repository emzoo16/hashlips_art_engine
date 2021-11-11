"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const { measureMemory } = require("vm");
const sha1 = require(path.join(basePath, "/node_modules/sha1"));
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const helper = require(path.join(basePath, "/src/helper.js"));

const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");
const {
  format,
  baseUri,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  extraMetadata,
  encodeImage,
  maxNumPerJsonFile,
  checkpoint,
} = require(path.join(basePath, "/src/config.js"));

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
var metadataList = [];
var attributesList = [];
var editionCount;
var numCreated = 0;
const DNA_DELIMITER = "-";

var dnaList = new Set();

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    const metadataPath = path.join(buildDir, "/json/metadataLists");
    const files = fs.readdirSync(metadataPath);

    console.log("Reading existing metadata files...");
    files.forEach(function (file, index) {
      const metadataFromFile = fs.readFileSync(
        path.join(metadataPath, file),
        "utf-8"
      );

      const metadataObject = JSON.parse(metadataFromFile);
      metadataList = metadataList.concat(metadataObject);
    });

    for (const index in metadataList) {
      const offByOneIndex = parseInt(index) + 1;

      if (
        metadataList[index]["name"] != helper.padZeros(offByOneIndex) ||
        metadataList[index]["edition"] != offByOneIndex
      ) {
        console.log(
          `Renaming ${metadataList[index]["edition"]}.png to ${offByOneIndex}.png`
        );
        metadataList[index]["name"] = helper.padZeros(offByOneIndex);
        metadataList[index]["edition"] = offByOneIndex;

        helper.base64DecodeAndSave(
          metadataList[index]["image"],
          path.join(buildDir, `/images/${offByOneIndex}.png`)
        );
      }
      dnaList.add(metadataList[index]["dna"]);
    }

    editionCount = dnaList.size + 1;
    console.log("Loaded and sorted " + dnaList.size + " NFT images");
  } else {
    fs.mkdirSync(buildDir);
    fs.mkdirSync(path.join(buildDir, "/json"));
    fs.mkdirSync(path.join(buildDir, "/json/metadataLists"));
    fs.mkdirSync(path.join(buildDir, "/images"));
    editionCount = 1;
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  var dna = Number(_str.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

// Gets all the possibilities for the given attribute. Filters out hidden files (.blah)
const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => {
      return !/(^|\/)\.[^\/\.]/g.test(item);
    })
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

// Given the list of layers, extracts the needed information from each directory
const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name: layerObj.options
      ? layerObj.options["displayName"] != undefined
        ? layerObj.options["displayName"]
        : layerObj.name
      : layerObj.name,
    blend: layerObj.options
      ? layerObj.options["blend"] != undefined
        ? layerObj.options["blend"]
        : "source-over"
      : "source-over",
    opacity: layerObj.options
      ? layerObj.options["opacity"] != undefined
        ? layerObj.options["opacity"]
        : 1
      : 1,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const addMetadata = (_dna, _edition, encoded_image) => {
  let dateTime = Date.now();
  let image = encodeImage ? encoded_image : `${baseUri}/${_edition}.png`;
  let tempMetadata = {
    dna: sha1(_dna),
    name: `${helper.padZeros(_edition)}`,
    description: description,
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "HashLips Art Engine",
    image: image,
  };
  metadataList.push(tempMetadata);
  console.log("metadata added " + _edition);
  console.log("length now " + metadataList.length);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  ctx.drawImage(_renderObject.loadedImage, 0, 0, format.width, format.height);
  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (dna) => {
  if (!dnaList.has(dna)) {
    dnaList.add(dna);
    return true;
  } else {
    return false;
  }
};

/** 
Choose attribute on each layer based on the based on it's rarity weighting 
The higher the weighting, the higher chance of getting it (weightings are relative not percentage)
Adds all weights together, picks random number and the attribute to "stop" on that number is
chosen
**/
const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}`
        );
      }
    }
  });

  const dna = randNum.join(DNA_DELIMITER);
  return dna;
};

const writeMetaData = (_data) => {
  let index = 0;
  let fileNum = 0;

  if (maxNumPerJsonFile > 1 && maxNumPerJsonFile < _data.length) {
    while (index < _data.length) {
      const dataPiece = _data.slice(index, index + maxNumPerJsonFile);

      fs.writeFileSync(
        `${buildDir}/json/metadataLists/${fileNum}_metadata.json`,
        JSON.stringify(dataPiece, null, 2)
      );
      index += maxNumPerJsonFile;
      fileNum++;
    }
  } else {
    fs.writeFileSync(
      `${buildDir}/json/metadataLists/0_metadata.json`,
      JSON.stringify(_data, null, 2)
    );
  }
};

const startCreating = async () => {
  let layerConfigIndex = 0;
  let failedCount = 0;
  let abstractedIndexes = [];

  abstractedIndexes = helper.getEditionIndicesToCreate(
    editionCount,
    layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo
  );

  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );

    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          ctx.clearRect(0, 0, format.width, format.height);
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length
            );
          });
          saveImage(abstractedIndexes[0]);

          const encoded_image = encodeImage
            ? helper.base64Encode(
                `${buildDir}/images/${abstractedIndexes[0]}.png`
              )
            : null;
          addMetadata(newDna, abstractedIndexes[0], encoded_image);

          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
        });
        dnaList.add(newDna);
        editionCount++;
        numCreated++;
        abstractedIndexes.shift();

        if (numCreated != 0 && numCreated % checkpoint == 0) {
          console.log("Saving checkpoint...");
          writeMetaData(metadataList);
        }
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
    writeMetaData(metadataList);
    console.log("Finished.");
  }
};

module.exports = { startCreating, buildSetup, getElements };
