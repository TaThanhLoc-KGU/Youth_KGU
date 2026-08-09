import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zmpVitePlugin from "zmp-vite-plugin";

export default defineConfig({
  plugins: [react(), zmpVitePlugin()],
});
