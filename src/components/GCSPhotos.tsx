import axios from "axios";

export async function identifyPhotos(src: String) {
  const response = await axios.get(import.meta.env.VITE_BACKEND_DETECTOR_URL, {
    method: "GET",
    params: {
      bucket: import.meta.env.VITE_GCS_BUCKET_NAME,
      resource: src,
    },
  });
  console.log(response);
  const photoIdentification = response.data;
  console.log(photoIdentification);
  //   console.log(photosList);

  return photoIdentification;
}

export async function GetGCSPhotos(nextQuery: "" | String) {
  console.log(
    `${
      import.meta.env.VITE_BACKEND_GETPHOTO_URL
    }?nextQueryPageToken=${nextQuery}`
  );
  const response = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_GETPHOTO_URL
    }?nextQueryPageToken=${nextQuery}`
  );
  const photosList = response.data;
  console.log(photosList);

  return photosList;
}
