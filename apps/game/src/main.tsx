import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { TranslationsProvider } from "./localization";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TranslationsProvider>
      <App />
    </TranslationsProvider>
  </StrictMode>
);
