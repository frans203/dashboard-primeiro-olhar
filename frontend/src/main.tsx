import React from "react";
import ReactDOM from "react-dom/client";

// Inter, self-hosted (works offline — no Google Fonts request). The "Variable" build is
// a single file covering every weight; wired as the default sans in tailwind.config.js.
import "@fontsource-variable/inter";

import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
