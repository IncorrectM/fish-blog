import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
const base = "/fish-blog";
export default defineConfig({
  base,
  title: "Fisher's Notebook",
  description: "A tech notebook for Fisher",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Go", link: "/go/001-a-glance-of-go" },
    ],

    sidebar: [
      {
        text: "Go",
        items: [
          { text: "Go的初印象", link: "/go/001-a-glance-of-go" },
          { text: "更具Go味的程序", link: "/go/002-the-go-way" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
