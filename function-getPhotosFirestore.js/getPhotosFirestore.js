const Firestore = require("@google-cloud/firestore");

// const db = new Firestore({
//   projectId: "omega-branch-385519",
//   keyFilename: "../function-tagMetadata/sa-firestore.json",
// });

const db = new Firestore({
  projectId: process.env.projectId,
  // keyFilename: process.env.SAkey
});

const firestoreCollectionName =
  process.env.firestoreCollectionName || "birthday-album-metadata";

async function queryFirestore(pageSize, startAfter) {
  let query = db
    .collection(firestoreCollectionName)
    .orderBy("__name__")
    .limit(pageSize);

  if (startAfter) {
    const startAfterDoc = await db
      .collection(firestoreCollectionName)
      .doc(startAfter)
      .get();
    query = query.startAfter(startAfterDoc);
  }

  const querySnapshot = await query.get();

  const newImages = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log("data: ");
    console.log(data);
    newImages.push({
      name: doc.id,
      metadata: { ...doc.data() }, //some may not have any fields like label
      // url: `https://masterchefgeorgi.com/${doc.id}`,
    });
  });

  return {
    images: newImages,
    lastDocId:
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1].id
        : null,
  };
}

exports.FetchData = async (req, res) => {
  // async function fetchData(pageSize, startAfter) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  const startAfter = req.query.nextQueryPageToken || null;
  const pageSize = req.query.maxResults ? parseInt(req.query.maxResults) : 10;

  console.log(startAfter, pageSize);

  async function fetchData(pageSize, startAfter) {
    const { images, lastDocId } = await queryFirestore(pageSize, startAfter);
    console.log(images);
    console.log(lastDocId);
    return { data: images, lastDocId: lastDocId };
  }

  try {
    const data = await fetchData(pageSize, startAfter);
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error: " + err);
  }
};

// let startAfter = "IMG_0221.jpg";
// let pageSize = 10;
// fetchData(pageSize, startAfter);
