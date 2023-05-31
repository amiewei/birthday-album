const Firestore = require("@google-cloud/firestore");
const fs = require("fs");

const db = new Firestore({
  projectId: "omega-branch-385519",
  keyFilename: "./function-tagMetadata/sa-firestore.json",
});

async function getAllLabels() {
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

  // Create an array of label and count pairs as separate lines
  const labelCountLines = Object.entries(labelCount).map(
    ([label, count]) => `${label}, ${count}`
  );

  console.log("Labels and Counts:");
  console.log(labelCountLines.join("\n"));

  // Sort the labelCountLines array by the count values in descending order
  labelCountLines.sort((a, b) => {
    const [, countA] = a.split(", ");
    const [, countB] = b.split(", ");
    return countB - countA;
  });

  writeToTxtFile(labelCountLines);

  // Take the top 5 labels
  const topFiveLabelCountPairs = labelCountLines.slice(0, 5);
  console.log(topFiveLabelCountPairs);
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

getAllLabels();
