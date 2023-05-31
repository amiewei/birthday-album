//https://react-photo-album.com/examples/masonry

import PhotoAlbum from "react-photo-album";
import React, { useState, useEffect, useRef } from "react";
// import { photos } from "../utilities/test-images";  //local testing without storage bucket

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// import optional lightbox plugins
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { FlagDivider } from "../utilities/bulgarian-flag-divider";
import Loading from "./Loading";
import axios from "axios";
import uniqid from "uniqid";

const maxResults = 25;
const gcsEndpoint = `${
  import.meta.env.VITE_BACKEND_GETPHOTO_URL
}?maxResults=${maxResults}&nextQueryPageToken=`;

const Gallery = () => {
  const [index, setIndex] = useState(-1);
  const [hugPhotos, setHugPhotos] = useState<Photo[]>([]);
  const [dancePhotos, setDancePhotos] = useState<Photo[]>([]);
  const [foodPhotos, setFoodPhotos] = useState<Photo[]>([]);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
  const [photosList, setPhotosList] = useState<Photo[]>([]); // storing list
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const nextQuery = useRef(" ");
  const isLoading = useRef(true);
  const isEndOfAlbum = useRef(false);

  interface Photo {
    isHug?: boolean;
    isFood?: boolean;
    isDance?: boolean;
    src: string;
    width: number;
    height: number;
  }

  const breakpoints = [3840, 2400, 1080, 640, 384, 256, 128, 96, 64, 48];

  let initialRender = true;

  async function updatePhotoFormat(photos: any) {
    const newPhotos = await Promise.all(
      photos.map(async (gcsObject: any) => {
        console.log(gcsObject);
        if (gcsObject.metadata.labels) {
          const parsedLabels = JSON.parse(gcsObject.metadata.labels);
          console.log(parsedLabels);
        } else {
          console.log([]);
        }
        const src = `https://masterchefgeorgi.com/images/${gcsObject.name}`;

        const imageWidth = gcsObject.metadata.imageWidth
          ? parseInt(gcsObject.metadata.imageWidth)
          : 4000;
        const imageHeight = gcsObject.metadata.imageHeight
          ? parseInt(gcsObject.metadata.imageHeight)
          : 3000;

        //set slide srcSet
        const srcSet = breakpoints.map((breakpoint) => {
          const srcSetImageWidth = Math.min(breakpoint, imageWidth);
          return {
            src: src,
            width: srcSetImageWidth,
            height: Math.round((imageHeight / imageWidth) * srcSetImageWidth),
          };
        });

        try {
          return {
            key: uniqid(),
            src,
            width: imageWidth,
            height: imageHeight,
            labels: gcsObject?.metadata.labels
              ? JSON.parse(gcsObject.metadata.labels)
              : [],
            isHug:
              gcsObject.metadata.isHug && gcsObject.metadata.isHug === "true"
                ? true
                : false,
            isDance:
              gcsObject.metadata.isDance &&
              gcsObject.metadata.isDance === "true"
                ? true
                : false,
            isPerson:
              gcsObject.metadata.isPerson &&
              gcsObject.metadata.isPerson === "true"
                ? true
                : false,
            //captures if food or ambiance (no person is in it)
            isFood:
              (gcsObject.metadata.isFood ?? false) &&
              (gcsObject.metadata.isFood === "true" ||
                gcsObject.metadata.isPerson === "false")
                ? true
                : false,
            srcSet,
          };
        } catch (error) {
          console.log(`Error with ${gcsObject.name}: ${error}`);
          return null;
        }
      })
    );

    console.log("newPhotos");
    console.log(newPhotos);
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

    setHugPhotos((prevPhotos) => [...prevPhotos, ...hugImages]);
    setDancePhotos((prevPhotos) => [...prevPhotos, ...danceImages]);
    setFoodPhotos((prevPhotos) => [...prevPhotos, ...foodImages]);
    setOtherPhotos((prevPhotos) => [...prevPhotos, ...otherImages]);

    return noNullPhotos;
  }

  useEffect(() => {
    if (initialRender) {
      console.log("use effect 1 - upon mounting");
      initialRender = false;
      fetchImages();
      window.addEventListener("scroll", handleScroll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    console.log("handleScroll");
    if (
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.offsetHeight
    ) {
      console.log("at bottom - to fetch images");

      if (isLoading.current === false) {
        // debugger;
        // if (photosList?.length < 350 && isLoading.current === false) {
        console.log(nextQuery.current);
        console.log("isloading: " + isLoading.current);
        fetchImages();
      }
    }
  };

  const fetchImages = async () => {
    console.log("fetchImage function");
    try {
      // setIsLoading(true);
      isLoading.current = true;
      const response = await axios.get(gcsEndpoint + nextQuery.current);
      const data = response.data;
      console.log("response data - axios");
      console.log(response);
      console.log(data);

      if (!data.lastDocId) {
        isEndOfAlbum.current = true;
      }

      const updatedFormatPhotos = await updatePhotoFormat(data.data);
      //parse through metadata and assign into different buckets -- use new function
      setPhotosList((photos) => [...photos, ...updatedFormatPhotos]);

      setIsFirstLoad(false);
      // setIsLoading(false);
      isLoading.current = false;
      nextQuery.current = data.lastDocId;
    } catch (e: any) {
      alert("Loading image from GCS bucket failed." + e);
      setError(e);
    }
  };

  return (
    <div className="max-w-screen-sm py-2 lg:max-w-screen-xl">
      {!isFirstLoad && photosList.length > 0 && (
        <>
          <h1 className="text-lg text-white lg:text-2xl">Party Pictures</h1>
          <FlagDivider />
          <PhotoAlbum
            photos={otherPhotos}
            layout="rows"
            targetRowHeight={300}
            onClick={({ index }) =>
              setIndex(
                hugPhotos?.length +
                  foodPhotos?.length +
                  dancePhotos?.length +
                  index
              )
            }
          />

          {photosList.length > 0 && hugPhotos.length > 0 && (
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

          {photosList.length > 0 && dancePhotos.length > 0 && (
            <>
              <h1 className="text-lg text-white lg:text-2xl">Dancing</h1>
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
            onClick={({ index }) =>
              setIndex(hugPhotos?.length + foodPhotos?.length + index)
            }
          />

          {photosList.length > 0 && foodPhotos.length > 0 && (
            <>
              <h1 className="text-lg text-white lg:text-2xl">
                Food & Ambiance
              </h1>
              <FlagDivider />
            </>
          )}
          <PhotoAlbum
            photos={foodPhotos}
            layout="masonry"
            columns={(containerWidth) => {
              if (containerWidth < 400) return 2;
              if (containerWidth < 800) return 3;
              return 4;
            }}
            targetRowHeight={300}
            onClick={({ index }) => setIndex(hugPhotos?.length + index)}
          />

          {photosList.length > 0 && (
            <Lightbox
              open={index >= 0}
              index={index}
              close={() => setIndex(-1)}
              slides={photosList.sort(
                (a, b) =>
                  Number(b.isHug ?? 0) - Number(a.isHug ?? 0) ||
                  Number(b.isFood ?? 0) - Number(a.isFood ?? 0) ||
                  Number(b.isDance ?? 0) - Number(a.isDance ?? 0)
              )}
              // enable optional lightbox plugins
              plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
            />
          )}
        </>
      )}

      {isLoading && !isEndOfAlbum.current && <Loading />}
    </div>
  );
};

export default React.memo(Gallery);
