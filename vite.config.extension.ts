import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// Extension build configuration
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      writeBundle() {
        const distDir = "extension/dist";
        const iconsDir = `${distDir}/icons`;

        // Ensure directories exist
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }

        // Copy manifest.json
        copyFileSync("extension/manifest.json", `${distDir}/manifest.json`);

        // Note: Icons need to be added manually or generated
        console.log("[Build] Extension files copied to extension/dist/");
        console.log("[Build] Remember to add icon files to extension/dist/icons/");
      },
    },
  ],
  build: {
    outDir: "extension/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: path.resolve(__dirname, "extension/sidebar/index.html"),
        background: path.resolve(__dirname, "extension/background.ts"),
        "content/content-script": path.resolve(
          __dirname,
          "extension/content/content-script.ts"
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep content script and background at root level with proper names
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "content/content-script") {
            return "content/content-script.js";
          }
          return "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    // Don't minify for easier debugging during development
    minify: false,
    // Generate source maps for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent code splitting for content scripts
  optimizeDeps: {
    exclude: ["extension/content/content-script.ts"],
  },
});
