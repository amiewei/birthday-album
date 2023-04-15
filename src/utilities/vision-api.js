// Imports the Google Cloud client libraries
const vision = require("@google-cloud/vision");
const fs = require("fs");

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function detectPerson(fileURL) {
  //if local file
  //   const request = {
  //     image: { content: fs.readFileSync(fileName) },
  //   };

  const [result] = await client.objectLocalization(fileURL);
  const objects = result.localizedObjectAnnotations;
  //   console.log(objects);
  const data = {};
  objects.forEach((object) => {
    if (object.name === "Person") {
      console.log(`Name: ${object.name}`);
      console.log(`Confidence: ${object.score}`);
      if (object.score > 0.4) {
        data["person"] = true;
      } else {
        data["person"] = false;
      }
    }
  });
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
  // Hug?
  data["isHug"] = data["labels"].includes("Hug");
  data["isDance"] = data["labels"].includes("Dance");
  data["isFood"] = data["labels"].includes("Food");
  //   console.log(data);
  return data;
}
// Call the async function
//   const [result] = await client.labelDetection(
//     `gs://${bucketName}/${fileName}`
//   );

const fileURL =
  "https://i.pinimg.com/736x/73/fe/7c/73fe7c191e7f0629e8397451ae4c820b.jpg";

// async function detectPersonAndHug(fileURL) {
//   const data = {};

//   // Call detectPerson() and add its returned data to the data object
//   const personData = await detectPerson(fileURL);
//   data["person"] = personData["person"];

//   // Call detectHug() and add its returned data to the data object
//   const hugData = await detectHug(fileURL);
//   data["labels"] = hugData["labels"];
//   data["isHug"] = hugData["isHug"];
//   console.log(data);

//   return data;
// }

async function detectPersonAndHug(request) {
  //   const bucket = request.args.get("bucket");
  //   const resource = request.args.get("resource");

  //   if (!bucket) {
  //     return ["Invalid invocation: require bucket", 400];
  //   }

  //   if (!resource) {
  //     return ["Invalid invocation: require resource", 400];
  //   }
  const bucket = "bulgarian-website-images-363516";
  const resource = "grouphug2.jpg";

  const uri = `gs://${bucket}/${resource}`;

  const data = {};

  // Call detectPerson() and add its returned data to the data object
  const personData = await detectPerson(uri);
  data["person"] = personData["person"];

  // Call detectHug() and add its returned data to the data object
  const hugData = await detectHug(uri);
  data["labels"] = hugData["labels"];
  data["isHug"] = hugData["isHug"];
  console.log(data);

  return [data, 200];
}

detectPersonAndHug(fileURL);
