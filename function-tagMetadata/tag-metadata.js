/**
 * this function will detect once an object is uploaded into gcs, call the vision api to retrieve labels and other metadata
 * then store the metadata as either
 * 1) google cloud object metadata
 * OR
 * 2) in google cloud firestore
 */

const functions = require("@google-cloud/functions-framework");
const vision = require("@google-cloud/vision");
const { Storage } = require("@google-cloud/storage");
const sizeOf = require("image-size");
const Firestore = require("@google-cloud/firestore");

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

  return data;
}

async function detectHug(fileURL) {
  data = {};
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

  const labels = result.labelAnnotations;

  //check for partial word matches in labels
  data["labels"] = labels.map((label) => label.description.toLowerCase());
  data["isHug"] = data["labels"].some((label) => {
    return label.includes("hug");
  });
  data["isDance"] = data["labels"].some((label) => {
    return label.includes("dance") || label.includes("performance");
  });
  data["isFood"] = data["labels"].some((label) => {
    return label.includes("food") || label.includes("cuisine");
  });

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

  // setFileMetadata(resource, bucketName, data);
  setFileMetadataInFirestore(resource, data);
}

// ------- alternative to store metadata as part of the object in GCS -------------
async function setFileMetadata(resource, bucketName, metadataToUpdate) {
  // Optional: set a meta-generation-match precondition to avoid potential race
  // conditions and data corruptions. The request to set metadata is aborted if the
  // object's metageneration number does not match your precondition.

  // Set file metadata to the object in cloud storage
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

//-------------------- store metadata in firestore ------------------
async function setFileMetadataInFirestore(resource, metadataToUpdate) {
  const db = new Firestore({
    projectId: "omega-branch-385519",
    keyFilename: "./function-tagMetadata/sa-firestore.json",
  });

  const docRef = db.collection("birthday-album-metadata").doc(resource); //resource is file name

  //.set() will completely overwrite. .update() will update difference
  if (metadataToUpdate && Object.keys(metadataToUpdate).length > 0) {
    await docRef.set({
      ...metadataToUpdate,
    });
    console.log("Updated metadata for object. Resource/File name: ", resource);
    console.log(metadataToUpdate);
    console.log("metadata update complete. exiting function");
    return metadataToUpdate;
  }
}

module.exports = {
  setFileMetadataInFirestore,
};

// ---------example data---------------
// const metadataToUpdate = {
//   labels: ["architecture", "city", "building", "street", "hug", "food"],
//   isHug: true,
//   isDance: false,
//   isFood: true,
//   imageWidth: 800,
//   imageHeight: 1200,
// };

// setFileMetadataInFirestore("IMG0404.jpg", metadataToUpdate);
