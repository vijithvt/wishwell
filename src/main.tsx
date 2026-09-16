import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/great-vibes/400.css";
import "./styles.css";
import { BirthdayStudio } from "./BirthdayStudio";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BirthdayStudio />
  </React.StrictMode>,
);
