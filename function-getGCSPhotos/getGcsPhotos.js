const { Storage } = require("@google-cloud/storage");
// require("dotenv").config();
// Creates a client
const storage = new Storage();
const bucketName = process.env.BUCKET_NAME;

//TO READ AN OBJECT's METADATA
async function getMetadata(fileName) {
  // Gets the metadata for the file
  const [metadata] = await storage
    .bucket(bucketName)
    .file(fileName)
    .getMetadata();
  if (metadata.metadata) {
    return metadata.metadata;
  }
}

//curl -X POST 'http://localhost:8080/?nextQueryPageToken=CgxJTUdfMDQwMi5qcGc=' -H 'Content-Type:application/json'
exports.GetGCSPhotos = async (req, res) => {
  console.log("Get GCS Photos. Bucket name is:");
  console.log(process.env.BUCKET_NAME);

  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  const gcsNextQuery = req.query.nextQueryPageToken || " ";
  const maxResults = req.query.maxResults ? parseInt(req.query.maxResults) : 10;

  console.log(gcsNextQuery, maxResults);
  const listFiles = async (gcsNextQuery, maxResults) => {
    const options = {
      maxResults: maxResults,
      pageToken: gcsNextQuery,
    };

    const [files, nextQuery] = await storage
      .bucket(bucketName)
      .getFiles(options);
    const fileInfo = [];

    for (const file of files) {
      const fileName = file.name;
      const metadata = await getMetadata(fileName);
      const updatedMetadata = {
        ...metadata,
        fileName: fileName,
      };
      fileInfo.push(updatedMetadata);
    }

    return { data: fileInfo, nextQueryPageToken: nextQuery };
  };

  try {
    const data = await listFiles(gcsNextQuery, maxResults);

    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
