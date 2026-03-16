import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
const base = "/fish-blog";
export default defineConfig({
  base,
  title: "Fisher's Notebook",
  description: "A tech notebook for Fisher",
  markdown: {
    math: true,
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Go", link: "/go/001-a-glance-of-go" },
      { text: "PreCrawl", link: "/go/101-precrawl" },
    ],

    sidebar: [
      {
        text: "Go",
        items: [
          { text: "Go的初印象", link: "/go/001-a-glance-of-go" },
          { text: "更具Go味的程序", link: "/go/002-the-go-way" },
          { text: "goroutine来并发", link: "/go/003-goroutine" },
          { text: "并发安全", link: "/go/004-concurrency-safety" },
          { text: "PreCrawl", link: "/go/101-precrawl" },
        ],
      },
      {
        text: "JavaScript",
        items: [{ text: "高阶函数", link: "/js/001-hof.md" }],
      },
      {
        text: "其他",
        link: "/others/000-others.md",
        items: [
          {
            text: "Redis",
            items: [
              {
                text: "Redis与缓存",
                link: "/others/redis/001-redis-and-cache",
              },
            ],
          },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
