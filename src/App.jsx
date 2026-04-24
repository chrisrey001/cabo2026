import React from "react";
import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import Cast from "./sections/Cast";
import Villa from "./sections/Villa";
import Flights from "./sections/Flights";
import Weather from "./sections/Weather";
import MapSection from "./sections/Map";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Cast />
        <Villa />
        <Flights />
        <Weather />
        <MapSection />
      </main>
    </>
  );
}
