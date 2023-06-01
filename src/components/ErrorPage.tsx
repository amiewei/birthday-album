import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className=" flex bg-emerald-800 px-4 py-20 dark:bg-gray-900 lg:py-36 lg:pb-2">
      <div className="mx-auto min-h-[70vh] justify-center px-2 py-4 pb-20 text-lg text-white lg:max-w-screen-xl lg:px-8 lg:text-2xl xl:gap-4">
        <h1 className="lg:text-4xl">Oops! You seem to be lost.</h1>
        <h1 className="py-4 text-center hover:text-secondary-400">
          <Link to="/">Click Here To Return Home</Link>
        </h1>
      </div>
    </section>
  );
}
