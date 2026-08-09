import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "zmp-ui";
import "zmp-ui/zaui.css";
import AppRouter from "./app";
import "./styles/global.css";

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App>
      <AppRouter />
    </App>
  </React.StrictMode>
);
