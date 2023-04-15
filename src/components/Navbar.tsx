import { Navbar } from "flowbite-react";
import React from "react";
import Confetti from "react-confetti";

export default function NavbarComponent() {
  return (
    <header>
      <Navbar
        fluid={true}
        rounded={false}
        className="fixed h-16 w-full bg-stone-100 shadow-md lg:h-24"
      >
        <Confetti width={2800} height={100} />
        <Navbar.Brand>
          {/* <img
            src="src/utilities/100balloon.png"
            alt="balloons"
            className="h-20"
          /> */}
          <span className="self-center font-display text-4xl font-semibold text-secondary-600 lg:whitespace-nowrap lg:pl-2 lg:text-7xl">
            Happy 100th Birthday!
          </span>
        </Navbar.Brand>
        {/* <Navbar.Toggle /> */}
        {/* <Navbar.Collapse> */}
        {/* <Navbar.Link className=" text-primary-600" href="/" active={true}>
            Home
          </Navbar.Link> */}
        {/* <Navbar.Link className="text-primary-600" href="/navbars">
            About
          </Navbar.Link>
          <Navbar.Link className="text-primary-600" href="/navbars">
            Contact
          </Navbar.Link> */}
        {/* </Navbar.Collapse> */}
      </Navbar>
    </header>
  );
}
