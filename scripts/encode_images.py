import json

with open("../build/json/_metadata.json") as metadata:
    data = json.load(metadata)
    print(len(data))
