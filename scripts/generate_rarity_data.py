import json
import os

metadata_file = "../build/json/_metadata.json"
output_directory = "./outputs"
output_file = "rarities.json"

with open(metadata_file) as json_file:
    metadata = json.load(json_file)

trait_freq_dict = {}
total_items = len(metadata)

for metadata_item in metadata:
    attributes = metadata_item["attributes"]
    increment_value = 1 / total_items

    for attribute in attributes:
        trait = attribute["trait_type"]
        value = attribute["value"]

        if trait in trait_freq_dict:
            if value in trait_freq_dict[trait]:
                trait_freq_dict[trait][value] += increment_value
            else:
                trait_freq_dict[trait][value] = increment_value
        else:
            trait_freq_dict[trait] = {}
            trait_freq_dict[trait][value] = increment_value

        trait_freq_dict[trait][value] = round(trait_freq_dict[trait][value], 2)

if not os.path.exists(output_directory):
    os.makedirs(output_directory)

with open(output_directory + "/" + output_file, "w") as output:
    json.dump(trait_freq_dict, output)