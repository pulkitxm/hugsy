export const origin = "https://pulkitxm.github.io/hugsy";

export function seo(title: string, description: string, path: string) {
  return {
    meta: [
      { title: `${title} | hugsy` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | hugsy` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${origin}${path}` },
      { property: "og:image", content: `${origin}/social.svg` },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `${title} | hugsy` },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: `${origin}${path}` }],
  };
}
