import type { ZudokuConfig } from "zudoku";

const config: ZudokuConfig = {
  theme: {
    light: {
      primary: "15 65% 35%",
      background: "20 20% 98%",
      primaryForeground: "0 0% 100%",
    },
    dark: {
      primary: "15 65% 55%",
      background: "20 15% 10%",
      primaryForeground: "0 0% 100%",
    },
  },
  site: {
    title: "SIDB API Docs",
  },
  docs: {
    files: "/pages/**/*.{md,mdx}",
  },
  apis: [
    {
      type: "file",
      input: "./public/openapi.json",
      path: "/api",
    },
  ],
  navigation: [
    {
      type: "category",
      label: "Dokumentasi",
      icon: "book-open",
      items: [
        {
          type: "doc",
          file: "index",
          label: "Pengenalan",
          path: "/",
        },
        {
          type: "doc",
          file: "context",
          label: "Konteks Proyek",
        },
        {
          type: "doc",
          file: "arsitektur",
          label: "Arsitektur API",
        },
        {
          type: "doc",
          file: "roles",
          label: "Flow & Roles",
        },
      ],
    },
    {
      type: "link",
      to: "/api",
      label: "API Reference",
      icon: "code-2",
    },
  ],
};

export default config;
