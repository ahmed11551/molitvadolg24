import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { federation } from "@module-federation/vite";
import path from "path";

const isVitest = process.env.VITEST === "true";
const isProduction = process.env.NODE_ENV === "production";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    !isVitest && !isProduction &&
      federation({
        name: "tasbihRemote",
        filename: "remoteEntry.js",
        exposes: {
          "./App": "./src/mf/index.tsx",
        },
        shared: {
          react: { singleton: true, requiredVersion: "^18.3.1" },
          "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
          "react-router-dom": { singleton: true, requiredVersion: "^6.30.1" },
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    modulePreload: false,
    minify: "esbuild", // Включаем минификацию для продакшена
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем на chunks для лучшей загрузки
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],
          "utils-vendor": ["date-fns", "zod"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "**/*.test.*",
        "**/*.spec.*",
      ],
    },
  },
});
