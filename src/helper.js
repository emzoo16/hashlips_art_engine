"use strict";
const fs = require("fs");

const getSortedMetadata = (metadata) => {
  return metadata.sort(compare);
};

function compare(a, b) {
  if (a.edition < b.edition) {
    return -1;
  }
  if (a.edition > b.edition) {
    return 1;
  }
  return 0;
}

const getEditionIndicesToCreate = (editionCount, maxEditions) => {
  const editionIndicesToCreate = [];
  while (editionCount <= maxEditions) {
    editionIndicesToCreate.push(editionCount);
    editionCount++;
  }

  if (editionIndicesToCreate.length > 0) {
    console.log("Creating " + editionIndicesToCreate.length + " editions...");
  } else {
    console.log("No editions left to create");
  }

  return editionIndicesToCreate;
};

const padZeros = (num) => {
  return ("0000" + num).slice(-4);
};

function base64Encode(file) {
  var contents = fs.readFileSync(file, { encoding: "base64" });
  return contents;
}

function base64DecodeAndSave(base64String, file) {
  fs.writeFileSync(file, base64String, { encoding: "base64" });
  console.log("******** File created from base64 encoded string ********");
}

module.exports = {
  getSortedMetadata,
  getEditionIndicesToCreate,
  padZeros,
  base64Encode,
  base64DecodeAndSave,
};
