/**
 * One time function to read all objects from gcs (objects that are already have metadata attached to the object),
 * then retrieve metadata and store in firestore
 */

const {
  setFileMetadataInFirestore,
} = require("../function-tagMetadata/tag-metadata");

const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const bucketName = "birthday-album-100";

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

//curl -X POST 'http://localhost:8080/?nextQueryPageToken=XXX=' -H 'Content-Type:application/json'
async function GetGCSPhotoMetadataAndUpdateFirestore() {
  const updateMetadata = async () => {
    const [files] = await storage.bucket(bucketName).getFiles();
    const numDocsUpdated = 0;
    if (files.length > 0) {
      for (const file of files) {
        const fileName = file.name;
        //get metadata from GCS object
        const metadata = await getMetadata(fileName);
        //update metadata into Firestore
        const updated = await setFileMetadataInFirestore(fileName, metadata);

        updated && numDocsUpdated++;
      }
    }
    return numDocsUpdated;
  };

  try {
    const numDocsUpdated = await updateMetadata();
    console.log("success, updated " + numDocsUpdated);
  } catch (err) {
    console.error(err);
  }
}

//---------- only run this function one time---------
// GetGCSPhotoMetadataAndUpdateFirestore();
