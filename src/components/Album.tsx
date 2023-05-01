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
// import { GetGCSPhotos } from "./GCSPhotos";
import { FlagDivider } from "../utilities/bulgarian-flag-divider";
import Loading from "./Loading";
import axios from "axios";
import uniqid from "uniqid";

const maxResults = 15;
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

  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const nextQuery = useRef(" ");

  interface Photo {
    isHug?: boolean;
    isFood?: boolean;
    isDance?: boolean;
    src: string;
    width: number;
    height: number;
  }

  interface Slide {
    src: string;
    width: number;
    height: number;
    srcSet?: any;
    isHug?: boolean;
    isFood?: boolean;
    isDance?: boolean;
  }

  const breakpoints = [3840, 2400, 1080, 640, 384, 256, 128, 96, 64, 48];

  async function updatePhotoFormat(photos: any) {
    console.log("updatePhotoFormat");

    const newPhotos = await Promise.all(
      photos.map(async (gcsObject: any) => {
        const src = `https://storage.googleapis.com/${
          import.meta.env.VITE_GCS_BUCKET_NAME
        }/${gcsObject.fileName}`;
        // console.log(gcsObject.fileName);

        //set slide srcSet
        const srcSet = breakpoints.map((breakpoint) => {
          const imageWidth = Math.min(breakpoint, gcsObject.imageWidth);
          const imageHeight = Math.round(
            (gcsObject.imageheight / gcsObject.imageWidth) * imageWidth
          );
          return {
            src: src,
            width: imageWidth,
            height: imageHeight,
          };
        });
        try {
          return {
            key: uniqid(),
            src,
            width: gcsObject.imageWidth ? parseInt(gcsObject.imageWidth) : 4000,
            height: gcsObject.imageHeight
              ? parseInt(gcsObject.imageHeight)
              : 3000,
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
            srcSet,
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
    console.log("use effect 1 - upon mounting");
    fetchImages();
    window.addEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    console.log("handleScroll");
    if (
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.offsetHeight
    ) {
      console.log(photosList?.length);
      console.log("isLoading: " + isLoading);

      //first time this doesnt load again. if you adjust code and save, it will run
      if (photosList?.length < 350 && isLoading === false) {
        // setIsLoading(true);
        console.log("req triggered");
        console.log("isLoading: " + isLoading);
        console.log(nextQuery.current);
        console.log("photolist under 350 images");
        fetchImages();
      }
    }
  };

  const fetchImages = async () => {
    console.log("fetchImage function");
    setIsLoading(true);
    try {
      const response = await axios.get(gcsEndpoint + nextQuery.current);
      const data = response.data;

      const updatedFormatPhotos = await updatePhotoFormat(data.data);
      //parse through metadata and assign into different buckets -- use new function
      setPhotosList((photos) => [...photos, ...updatedFormatPhotos]);

      setIsFirstLoad(false);
      setIsLoading(false);
      nextQuery.current = data.nextQueryPageToken.pageToken;
    } catch (e: any) {
      alert("Loading image from GCS bucket failed." + e);
      setError(e);
    }
  };

  return (
    <div className="max-w-screen-sm py-2 lg:max-w-screen-xl">
      {isFirstLoad ? (
        <Loading />
      ) : (
        <>
          {photosList.length ? (
            <>
              <div className="flex text-lg text-white lg:text-2xl">
                <h1>
                  {/* Total Photos Loaded (Slides Length): {slides.length} | */}
                  PhotosList Length: {photosList.length}
                  Index: {index}
                </h1>
              </div>

              {photosList.length > 0 && (
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

              <h1 className="text-lg text-white lg:text-2xl">
                Food & Ambiance
              </h1>
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
                onClick={({ index }) => setIndex(hugPhotos?.length + index)}
              />

              {photosList.length > 0 && (
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
                onClick={({ index }) =>
                  setIndex(hugPhotos?.length + foodPhotos?.length + index)
                }
              />

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
          ) : null}
        </>
      )}

      {isLoading && (
        <div className={"loading-new-images-container"}>
          <div className="loading-new-images">Loading New Images ...</div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Gallery);
