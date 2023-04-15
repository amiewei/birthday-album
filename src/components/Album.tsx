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
  const [photos, setAllPhotos] = useState<Photo[]>([]);
  const [hugPhotos, setHugPhotos] = useState<Photo[]>([]);
  const [dancePhotos, setDancePhotos] = useState<Photo[]>([]);
  const [foodPhotos, setFoodPhotos] = useState<Photo[]>([]);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);

  interface Photo {
    src: string;
    width: number;
    height: number;
  }

  // useEffect(() => {
  //   async function fetchPhotos() {
  //     const photosList = await GetGCSPhotos();
  //     const newPhotos = await Promise.all(
  //       photosList.map(async (photoName: string) => {
  //         const img = new Image();
  //         const src = `https://storage.googleapis.com/${
  //           import.meta.env.VITE_GCS_BUCKET_NAME
  //         }/${photoName}`;
  //         img.src = src;
  //         await img.decode();
  //         return {
  //           src,
  //           width: img.width,
  //           height: img.height,
  //         };
  //       })
  //     );
  //     setPhotos(newPhotos);
  //   }
  //   fetchPhotos();
  // }, []);

  useEffect(() => {
    async function fetchPhotos() {
      const photosList = await GetGCSPhotos();
      console.log(photosList);

      const newPhotos = await Promise.all(
        photosList.map(async (photoName: string) => {
          const src = `https://storage.googleapis.com/${
            import.meta.env.VITE_GCS_BUCKET_NAME
          }/${photoName}`;
          const photoData = await identifyPhotos(photoName);
          console.log(photoData);

          const img = new Image();
          img.src = src;
          await img.decode();
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
        })
      );

      const hugImages = newPhotos.filter((image) => image.isHug);
      const danceImages = newPhotos.filter((image) => image.isDance);
      const foodImages = newPhotos.filter((image) => image.isFood);
      const otherImages = newPhotos.filter(
        (image) => !image.isHug && !image.isDance && !image.isFood
      );
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
      //need to categorize the photos into different sections
      setAllPhotos(allImages);
    }
    fetchPhotos();
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
    <div className="py-2">
      <h1 className="text-2xl text-white">Party Pictures</h1>
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
          <h1 className="text-2xl text-white">Hugs</h1>
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

      <h1 className="text-2xl text-white">Food</h1>
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
          <h1 className="text-2xl text-white">Dance</h1>
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
