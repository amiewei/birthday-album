const functions = require("@google-cloud/functions-framework");
const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const sizeOf = require("image-size");

// Creates a client
const storage = new Storage();
const client = new vision.ImageAnnotatorClient();

// Register a CloudEvent callback with the Functions Framework that will
// be triggered by Cloud Storage.
functions.cloudEvent("detectObjectInGCS", (cloudEvent) => {
  console.log(`Event ID: ${cloudEvent.id}`);
  console.log(`Event Type: ${cloudEvent.type}`);

  const file = cloudEvent.data;
  console.log(`Bucket: ${file.bucket}`);
  console.log(`File: ${file.name}`);
  console.log(`Metageneration: ${file.metageneration}`);
  console.log(`Created: ${file.timeCreated}`);
  console.log(`Updated: ${file.updated}`);

  const resource = file.name;
  const bucketName = file.bucket;

  detectPersonAndHug(resource, bucketName);
});

async function getImageSize(resource, bucketName) {
  console.log("getImageSize: ", resource, bucketName);
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(resource);

  const [fileExists] = await file.exists();
  if (!fileExists) {
    throw new Error(
      `File '${resource}' does not exist in bucket '${bucketName}'`
    );
  }

  try {
    //download file into a buffer in memory and get width and height
    const [buffer] = await file.download();
    const dimensions = sizeOf(buffer);
    console.log(dimensions.width, dimensions.height);
    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.log(`Error decoding ${resource}: ${error}`);
    return null;
  }
}

async function detectPerson(fileURL) {
  const [result] = await client.objectLocalization(fileURL);
  const objects = result.localizedObjectAnnotations;
  //   console.log(objects);
  const data = {};
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    if (object.name === "Person") {
      console.log(`Name: ${object.name}`);
      console.log(`Confidence: ${object.score}`);
      if (object.score > 0.4) {
        data["isPerson"] = true;
        break;
      }
    } else {
      data["isPerson"] = false;
    }
  }
  //   console.log(data);
  return data;
}

async function detectHug(fileURL) {
  data = {};
  //   const [result] = await client.labelDetection(fileURL);
  const [result] = await client.annotateImage({
    image: {
      source: {
        imageUri: fileURL,
      },
    },
    features: [
      {
        maxResults: 100,
        type: "LABEL_DETECTION",
      },
    ],
  });
  //   console.log(result);
  const labels = result.labelAnnotations;

  data["labels"] = labels.map((label) => label.description);
  data["isHug"] = data["labels"].includes("Hug");
  data["isDance"] = data["labels"].includes("Dance");
  data["isFood"] = data["labels"].includes("Food");

  return data;
}

async function detectPersonAndHug(resource, bucketName) {
  console.log("detectPersonAndHug");

  console.log(bucketName + ", " + resource);

  if (!bucketName) {
    console.error("Invalid invocation: require bucket");
  }

  if (!resource) {
    console.error("Invalid invocation: require resource");
  }

  const uri = `gs://${bucketName}/${resource}`;

  const data = {};

  // Call detectPerson() and add its returned data to the data object
  const personData = await detectPerson(uri);
  data["isPerson"] = personData["isPerson"];

  // Call detectHug() and add its returned data to the data object
  const hugData = await detectHug(uri);

  // Call getImageSize and add its returned data to the data object
  const { width, height } = await getImageSize(resource, bucketName);

  //turn array into string so it can be stored in object metadata
  data["labels"] = JSON.stringify(hugData["labels"]);
  data["isHug"] = hugData["isHug"];
  data["isDance"] = hugData["isDance"];
  data["isFood"] = hugData["isFood"];

  //if people and food are both tagged, then don't put under food!
  if (data["isPerson"] && data["isFood"]) {
    data["isFood"] = false;
  }

  //add width and height to data
  data["imageWidth"] = width;
  data["imageHeight"] = height;

  setFileMetadata(resource, bucketName, data);
}

async function setFileMetadata(resource, bucketName, metadataToUpdate) {
  // Optional: set a meta-generation-match precondition to avoid potential race
  // conditions and data corruptions. The request to set metadata is aborted if the
  // object's metageneration number does not match your precondition.

  // Set file metadata.
  const [metadata] = await storage
    .bucket(bucketName)
    .file(resource)
    .setMetadata({
      metadata: metadataToUpdate,
    });

  console.log(
    "Updated metadata for object. Resource/File name: ",
    resource,
    "in bucket: ",
    bucketName
  );
  console.log(metadata);
  console.log("metadata update complete. exiting function");
}
