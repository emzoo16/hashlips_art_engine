import base64
import requests
import os
import pprint
import json

base_endpoint = "https://api.nft-maker.io/uploadNft/"
api_key = "155878c9c1484144a0ff3c715821aa9d"
project_id = "22065"

metadata_directory = "../build/json/metadataLists/"

for file in os.listdir(metadata_directory):
    if file.startswith("."):
        continue

    print(file)
    with open("../build/json/metadataLists/" + file) as metadata:
        metadataList = json.load(metadata)

        for nft_metadata in metadataList:

            metadata_placeholders = []

            for attribute in nft_metadata["attributes"]:
                attribute_value = {}

                attribute_value["name"] = attribute["trait_type"]
                attribute_value["value"] = attribute["value"]

                metadata_placeholders.append(attribute_value)

            headers = {"Content-type": "application/json", "Accept": "application/json"}

            request_body = {
                "assetName": nft_metadata["name"],
                "previewImageNft": {
                    "mimetype": "image/png",
                    "fileFromBase64": nft_metadata["image"],
                    "description": nft_metadata["description"],
                    "displayname": "Jeminia display string",
                    "metadataPlaceholder": metadata_placeholders,
                },
                "subfiles": [],
            }

            print("processing " + nft_metadata["name"])

            response = requests.post(
                base_endpoint + api_key + "/" + project_id,
                data=json.dumps(request_body),
                headers=headers,
            )

            print(response.text)
