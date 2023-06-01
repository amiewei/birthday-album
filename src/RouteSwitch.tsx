import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import NavbarComponent from "./components/Navbar";
import Footer from "./components/Footer";
import NotFound from "./components/ErrorPage";

const RouteSwitch = () => {
  return (
    <BrowserRouter>
      <NavbarComponent />

      <Routes>
        {["/", "/app"].map((path, index) => {
          return <Route path={path} element={<App />} key={index} />;
        })}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
};

export default RouteSwitch;
