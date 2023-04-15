import Gallery from "./Album";

export function Home() {
  return (
    <section className="bg-emerald-800 py-20 dark:bg-gray-900 lg:py-36 lg:pb-2">
      <div className="mx-auto grid px-8 py-4 pb-20 lg:max-w-screen-xl xl:gap-4">
        <h1 className="text-8xl text-white">Celebrating Кирил </h1>
        <h1 className="text-2xl text-white">May 15th, 2023 - Chicago, IL</h1>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Bulgaria.svg/2560px-Flag_of_Bulgaria.svg.png"
          alt="bulgarian flag"
          className="h-10 w-full"
        />
        <Gallery />
      </div>
    </section>
  );
}
