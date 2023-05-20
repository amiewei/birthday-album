const Firestore = require("@google-cloud/firestore");
const fs = require("fs");

const db = new Firestore({
  projectId: "omega-branch-385519",
  keyFilename: "./function-tagMetadata/sa-firestore.json",
});

async function getTopFive() {
  const collectionRef = db.collection("birthday-album-metadata");

  // Query for documents that have a 'labels' field
  const querySnapshot = await collectionRef
    .where("labels", "!=", null)
    // .limit(5)
    .get();

  // Count the occurrence of each label in the 'labels' arrays
  const labelCount = {};
  querySnapshot.forEach((doc) => {
    let labels = doc.data().labels;
    if (typeof labels === "string") {
      labels = JSON.parse(labels);
    }

    labels.forEach((label) => {
      if (labelCount[label]) {
        labelCount[label]++;
      } else {
        labelCount[label] = 1;
      }
    });
  });

  // Sort the labelCount object by the count values in descending order
  const sortedLabels = Object.keys(labelCount).sort((a, b) => {
    return labelCount[b] - labelCount[a];
  });

  console.log(sortedLabels);
  writeToTxtFile(sortedLabels);

  // Take the top 5 labels
  const topLabels = sortedLabels.slice(0, 5);
  console.log("Top 5 labels:", topLabels);
}

function writeToTxtFile(sortedLabels) {
  fs.writeFile("labeloutput.txt", sortedLabels.join("\n"), (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Sorted labels written to file");
    }
  });
}

getTopFive();
