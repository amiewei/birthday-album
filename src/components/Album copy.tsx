//https://react-photo-album.com/examples/masonry

import PhotoAlbum from "react-photo-album";
import { useState, useEffect } from "react";
// import { photos } from "../utilities/test-images";  //local testing without storage bucket

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// import optional lightbox plugins
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { GetGCSPhotos, identifyPhotos } from "./GCSPhotos";
import { FlagDivider } from "../utilities/bulgarian-flag-divider";

export default function Gallery() {
  const [index, setIndex] = useState(-1);
  const [allPhotosGCS, setAllPhotosGCS] = useState<Photo[]>([]);
  const [photos, setAllPhotos] = useState<Photo[]>([]);
  const [hugPhotos, setHugPhotos] = useState<Photo[]>([]);
  const [dancePhotos, setDancePhotos] = useState<Photo[]>([]);
  const [foodPhotos, setFoodPhotos] = useState<Photo[]>([]);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);

  interface Photo {
    src: string;
    width: number;
    height: number;
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    const isBottom = pageScrolledToBottom();
    if (scrollTop + clientHeight >= scrollHeight - 5 && isBottom) {
      console.log("scrolled to the bottom");
      setPage((page) => page + 1);
    }
  }

  function pageScrolledToBottom() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    return scrollTop + clientHeight === scrollHeight;
  }

  async function fetchPhotos(page: number) {
    const pageSize = 25;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    console.log("startIndex is " + startIndex + " endIndex is " + endIndex);

    // Step 2: Get the selected photos to display on the current page
    if (allPhotosGCS) {
      console.log("all photos GCS is loaded");
      const selectedPhotos = allPhotosGCS.slice(startIndex, endIndex);

      const newPhotos = await Promise.all(
        selectedPhotos.map(async (photoName) => {
          const src = `https://storage.googleapis.com/${
            import.meta.env.VITE_GCS_BUCKET_NAME
          }/${photoName}`;
          console.log(photoName);
          const photoData = await identifyPhotos(String(photoName));
          console.log(photoData);

          const img = new Image();
          img.src = src;
          try {
            await img.decode();
            console.log(photoName, img.width, img.height);
            return {
              src,
              width: img.width,
              height: img.height,
              labels: photoData.labels,
              isHug: photoData.isHug,
              isDance: photoData.isDance,
              person: photoData.person,
              isFood: photoData.isFood,
            };
          } catch (error) {
            console.log(`Error decoding ${photoName}: ${error}`);
            return null; // or handle the error in some other way
          }
        })
      );

      const noNullPhotos = newPhotos.filter((image) => image !== null);

      const hugImages = noNullPhotos.filter(
        (image) => image && image.isHug
      ) as Photo[];
      const danceImages = noNullPhotos.filter(
        (image) => image && image.isDance
      ) as Photo[];
      const foodImages = noNullPhotos.filter(
        (image) => image && image.isFood
      ) as Photo[];
      const otherImages = noNullPhotos.filter(
        (image) => image && !image.isHug && !image.isDance && !image.isFood
      ) as Photo[];

      setHugPhotos(hugImages);
      setDancePhotos(danceImages);
      setFoodPhotos(foodImages);
      setOtherPhotos(otherImages);

      console.log("hugImages:");
      console.log(hugImages);
      console.log("danceImages");
      console.log(danceImages);
      console.log("otherImages:");
      console.log(otherImages);

      const allImages = otherImages.concat(hugImages, foodImages, danceImages);
      setAllPhotos(allImages);

      return allImages;
    } else {
      return [];
    }
  }

  async function loadMorePhotos() {
    const newPhotos = await fetchPhotos(page);
    setAllPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
  }

  useEffect(() => {
    loadMorePhotos();
  }, [page, allPhotosGCS]);

  useEffect(() => {
    async function loadInitialGCSPhotos() {
      const photosList = await GetGCSPhotos();
      setAllPhotosGCS(photosList);
    }
    loadInitialGCSPhotos();
  }, []);

  console.log(photos);

  const breakpoints = [3840, 2400, 1080, 640, 384, 256, 128, 96, 64, 48];

  const photos_new = photos.map((photo: Photo) => {
    const width = breakpoints[0];
    const height = (photo.height / photo.width) * width;
    return {
      src: photo.src,
      width,
      height,
      images: breakpoints.map((breakpoint) => {
        const height = Math.round((photo.height / photo.width) * breakpoint);
        return {
          src: photo.src,
          width: breakpoint,
          height,
        };
      }),
    };
  });

  const slides = photos_new.map(({ src, width, height, images }: any) => ({
    src,
    width,
    height,
    srcSet: images.map((image: Photo) => ({
      src: image.src,
      width: image.width,
      height: image.height,
    })),
  }));

  return (
    <div className="max-w-screen-sm py-2 lg:max-w-screen-xl">
      {/* <h1 className="text-lg text-white lg:text-2xl">Party Pictures</h1>
      <FlagDivider />
      <PhotoAlbum
        photos={otherPhotos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={300}
        onClick={({ index }) => setIndex(index)}
      />

      {hugPhotos.length > 0 && (
        <>
          <h1 className="text-lg text-white lg:text-2xl">Hugs</h1>
          <FlagDivider />
        </>
      )}
      <PhotoAlbum
        photos={hugPhotos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={300}
        onClick={({ index }) => setIndex(index)}
      />

      <h1 className="text-lg text-white lg:text-2xl">Food & Ambiance</h1>
      <FlagDivider />
      <PhotoAlbum
        photos={foodPhotos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={300}
        onClick={({ index }) => setIndex(index)}
      />

      {dancePhotos.length > 0 && (
        <>
          <h1 className="text-lg text-white lg:text-2xl">Dance</h1>
          <FlagDivider />
        </>
      )}

      <PhotoAlbum
        photos={dancePhotos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={300}
        onClick={({ index }) => setIndex(index)}
      /> */}

      {/* this is just loading all photos */}
      {photos.length > 0 && (
        <>
          <h1 className="text-lg text-white lg:text-2xl">Photos</h1>
          <FlagDivider />
        </>
      )}

      <PhotoAlbum
        photos={photos}
        layout="masonry"
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={300}
        onClick={({ index }) => setIndex(index)}
      />

      <Lightbox
        slides={slides}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        // enable optional lightbox plugins
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
      />
    </div>
  );
}

// useEffect(() => {
//   async function fetchPhotos() {
//     const photosList = await GetGCSPhotos();
//     console.log(photosList);

//     const newPhotos = await Promise.all(
//       photosList.slice(0, 100).map(async (photoName: string) => {
//         const src = `https://storage.googleapis.com/${
//           import.meta.env.VITE_GCS_BUCKET_NAME
//         }/${photoName}`;
//         console.log(photoName);
//         const photoData = await identifyPhotos(photoName);
//         console.log(photoData);

//         const img = new Image();
//         img.src = src;
//         try {
//           await img.decode();
//           console.log(photoName, img.width, img.height);
//           return {
//             src,
//             width: img.width,
//             height: img.height,
//             labels: photoData.labels,
//             isHug: photoData.isHug,
//             isDance: photoData.isDance,
//             person: photoData.person,
//             isFood: photoData.isFood,
//           };
//         } catch (error) {
//           console.log(`Error decoding ${photoName}: ${error}`);
//           return null; // or handle the error in some other way
//         }
//       })
//     );

//     const noNullPhotos = newPhotos.filter((image) => image !== null);

//     const hugImages = noNullPhotos.filter((image) => image && image.isHug);
//     const danceImages = noNullPhotos.filter(
//       (image) => image && image.isDance
//     );
//     const foodImages = noNullPhotos.filter((image) => image && image.isFood);
//     const otherImages = noNullPhotos.filter(
//       (image) => !image.isHug && !image.isDance && !image.isFood
//     );
//     setHugPhotos(hugImages);
//     setDancePhotos(danceImages);
//     setFoodPhotos(foodImages);
//     setOtherPhotos(otherImages);

//     console.log("hugImages:");
//     console.log(hugImages);
//     console.log("danceImages");
//     console.log(danceImages);
//     console.log("otherImages:");
//     console.log(otherImages);

//     const allImages = otherImages.concat(hugImages, foodImages, danceImages);
//     //need to categorize the photos into different sections
//     setAllPhotos(allImages);
//     // setAllPhotos(noNullPhotos);
//   }
//   fetchPhotos();
// }, []);
