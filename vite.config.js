import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // ścieżka bazowa pod GitHub Pages: https://<user>.github.io/AplikacjaFitGym/
  base: "/AplikacjaFitGym/",
  plugins: [react()],
});
