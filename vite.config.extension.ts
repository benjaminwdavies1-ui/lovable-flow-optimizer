import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// Extension build configuration
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest-and-assets",
      writeBundle() {
        const distDir = "extension/dist";
        const iconsDir = `${distDir}/icons`;
        const sidebarDir = `${distDir}/sidebar`;

        // Ensure directories exist
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        if (!existsSync(sidebarDir)) {
          mkdirSync(sidebarDir, { recursive: true });
        }

        // Copy manifest.json
        copyFileSync("extension/manifest.json", `${distDir}/manifest.json`);

        // Copy icons
        const iconSizes = ["16", "32", "48", "128"];
        iconSizes.forEach((size) => {
          const iconPath = `extension/icons/icon${size}.png`;
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, `${iconsDir}/icon${size}.png`);
          }
        });

        console.log("[Build] Extension files copied to extension/dist/");
      },
    },
  ],
  build: {
    outDir: "extension/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "sidebar/index": path.resolve(__dirname, "extension/sidebar/index.html"),
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
          if (chunkInfo.name === "sidebar/index") {
            return "sidebar/index.js";
          }
          return "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // Keep CSS in sidebar folder for the sidebar
          if (assetInfo.name?.endsWith(".css")) {
            return "sidebar/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
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
