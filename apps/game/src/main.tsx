import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { TranslationsProvider } from "./translations";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TranslationsProvider>
      <App />
    </TranslationsProvider>
  </StrictMode>
);
