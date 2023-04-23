//https://react-photo-album.com/examples/masonry

import PhotoAlbum from "react-photo-album";
import { useState, useEffect, useRef, MutableRefObject } from "react";
// import { photos } from "../utilities/test-images";  //local testing without storage bucket

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// import optional lightbox plugins
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { GetGCSPhotos } from "./GCSPhotos";
import { FlagDivider } from "../utilities/bulgarian-flag-divider";

export default function Gallery() {
  const [index, setIndex] = useState(-1);
  const [portionPhotosGCS, setPortionPhotosGCS] = useState<Photo[]>([]);
  const [hugPhotos, setHugPhotos] = useState<Photo[]>([]);
  const [dancePhotos, setDancePhotos] = useState<Photo[]>([]);
  const [foodPhotos, setFoodPhotos] = useState<Photo[]>([]);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
  const [currPage, setCurrPage] = useState(1); // storing current page number
  const [prevPage, setPrevPage] = useState(0); // storing prev page number
  const [photosList, setphotosList] = useState<Photo[]>([]); // storing list
  const [wasLastList, setWasLastList] = useState(false); // setting a flag to know the last list
  const [slides, setSlides] = useState<Photo[]>([]);
  const [nextQuery, setNextQuery] = useState("");

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
    console.log("handleScroll function");
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    // const isBottom = pageScrolledToBottom();
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      // if (scrollTop + clientHeight >= scrollHeight - 5 && isBottom) {
      console.log("onscroll, adding currPage");
      setCurrPage((prevPage) => prevPage + 1);
    }
  }

  async function fetchPhotos(portionPhotosGCS: any) {
    console.log("fetchPhotos functions. fetching a portion of photos");

    const newPhotos = await Promise.all(
      portionPhotosGCS.map(async (gcsObject: any) => {
        const src = `https://storage.googleapis.com/${
          import.meta.env.VITE_GCS_BUCKET_NAME
        }/${gcsObject.fileName}`;
        // console.log(gcsObject.fileName);
        try {
          console.log(
            gcsObject.fileName,
            gcsObject.imageWidth,
            gcsObject.imageHeight
          );
          return {
            src,
            width: gcsObject.imageWidth ?? 0,
            height: gcsObject.imageHeight ?? 0,
            labels: gcsObject?.labels ? JSON.parse(gcsObject.labels) : [],
            isHug: gcsObject.isHug && gcsObject.isHug === "true" ? true : false,
            isDance:
              gcsObject.isDance && gcsObject.isDance === "true" ? true : false,
            isPerson:
              gcsObject.isPerson && gcsObject.isPerson === "true"
                ? true
                : false,
            //captures if food or ambiance (no person is in it)
            isFood:
              (gcsObject.isFood ?? false) &&
              (gcsObject.isFood === "true" || gcsObject.isPerson === "false")
                ? true
                : false,
          };
        } catch (error) {
          console.log(`Error with ${gcsObject.fileName}: ${error}`);
          return null; // or handle the error in some other way
        }
      })
    );

    console.log("newPhotos");
    console.log(newPhotos);
    const noNullPhotos = newPhotos.filter((image) => image !== null);

    const nullPhotosFilteredOut = newPhotos.filter((image) => image === null);
    console.log("null photos filtered out");
    console.log(nullPhotosFilteredOut);

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

    setHugPhotos((prevPhotos) => [...prevPhotos, ...hugImages]);
    setDancePhotos((prevPhotos) => [...prevPhotos, ...danceImages]);
    setFoodPhotos((prevPhotos) => [...prevPhotos, ...foodImages]);
    setOtherPhotos((prevPhotos) => [...prevPhotos, ...otherImages]);

    const allImages = otherImages.concat(hugImages, foodImages, danceImages);
    return allImages;
  }

  // useEffect(() => {
  //   console.log("2nd useEffect");
  const fetchData = async (data: Photo[]) => {
    if (portionPhotosGCS.length > 0 && !wasLastList && prevPage !== currPage) {
      console.log("portionPhotosGCS: fetching portion");
      console.log(data);
      if (!data.length) {
        setWasLastList(true);
        return;
      }
      setPrevPage(currPage);
      const portionPhotosList = await fetchPhotos(data);
      setphotosList([...photosList, ...portionPhotosList]);
    }
  };

  //why sometimes pages get loaded twice - same child key
  //images above disappears when scrolling down page??
  //upon initial load page, getGCSphotos (50 at a time and get next page token)
  //store portionPhoto in the state

  //infinite scrol with Intersection Observer API
  //https://rajrajhans.com/2021/04/pagination-and-infinite-scroll-in-react/

  useEffect(() => {
    async function loadInitialGCSPhotos() {
      console.log("1st useEffect");
      const { data, nextQueryPageToken } = await GetGCSPhotos(nextQuery);
      console.log(data);
      console.log(nextQueryPageToken);
      setPortionPhotosGCS(data);
      setNextQuery(nextQueryPageToken);
    }
    loadInitialGCSPhotos();
  }, [currPage]);

  useEffect(() => {
    fetchData(portionPhotosGCS);
  }, [portionPhotosGCS]);

  const breakpoints = [3840, 2400, 1080, 640, 384, 256, 128, 96, 64, 48];

  useEffect(() => {
    const slides = photosList.map((photo: Photo) => {
      const { src, width, height } = photo;

      const srcSet = breakpoints.map((breakpoint) => {
        const imageWidth = Math.min(breakpoint, width);
        const imageHeight = Math.round((height / width) * imageWidth);

        return {
          src: photo.src,
          width: imageWidth,
          height: imageHeight,
        };
      });

      return {
        src,
        width,
        height,
        srcSet,
      };
    });

    setSlides((prevSlides) => [...prevSlides, ...slides]);
  }, [photosList]);

  return (
    <div className="max-w-screen-sm py-2 lg:max-w-screen-xl">
      {photosList.length === 0 ? (
        <h1 className="text-center text-white">Loading...</h1>
      ) : (
        <>
          <h1 className="text-lg text-white lg:text-2xl">Party Pictures</h1>
          <FlagDivider />
          <PhotoAlbum
            photos={otherPhotos}
            layout="rows"
            // columns={(containerWidth) => {
            //   if (containerWidth < 400) return 2;
            //   if (containerWidth < 800) return 3;
            //   return 4;
            // }}
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
          />

          {slides.length > 0 && (
            <Lightbox
              slides={slides}
              open={index >= 0}
              index={index}
              close={() => setIndex(-1)}
              // enable optional lightbox plugins
              plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
            />
          )}
        </>
      )}

      <div className="flex justify-center text-center text-white">
        {portionPhotosGCS.length > photosList.length &&
        portionPhotosGCS.length !== 0 ? (
          <h1>Scroll Down to Load More Pictures...</h1>
        ) : null}
      </div>
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
