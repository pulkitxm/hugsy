import { siteOrigin as origin } from "../../registry/site";

const siteName = "Hugsy";
const repository = "https://github.com/pulkitxm/hugsy";
const license = `${repository}/blob/main/LICENSE`;
const sections: Record<string, string> = { components: "Components", docs: "Docs" };

function breadcrumbs(title: string, path: string) {
  const [section, page] = path.split("/").filter(Boolean);
  if (!section) {
    return [];
  }
  const trail = [{ name: "Home", path: "/" }];
  if (page) {
    trail.push({ name: sections[section] ?? section, path: `/${section}/` });
  }
  trail.push({ name: title, path });
  return trail;
}

function primaryEntity(title: string, description: string, path: string) {
  const url = `${origin}${path}`;
  if (path === "/") {
    return { "@type": "WebSite", name: siteName, url, description };
  }
  if (path === "/components/") {
    return { "@type": "CollectionPage", name: title, url, description };
  }
  if (path.startsWith("/components/")) {
    return {
      "@type": "SoftwareSourceCode",
      name: title,
      url,
      description,
      codeRepository: repository,
      programmingLanguage: "Swift",
      runtimePlatform: "iOS 17",
      license,
    };
  }
  return { "@type": "TechArticle", headline: title, url, description };
}

function structuredData(title: string, description: string, path: string) {
  const trail = breadcrumbs(title, path);
  const graph: object[] = [primaryEntity(title, description, path)];
  if (trail.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: trail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${origin}${item.path}`,
      })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll(
    "<",
    "\\u003c",
  );
}

export function seo(title: string, description: string, path: string) {
  const fullTitle = `${title} | ${siteName}`;
  const url = `${origin}${path}`;
  const image = `${origin}${openGraphImage(path)}`;
  const imageAlt = `${title}. Animated iOS components for SwiftUI and UIKit.`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:site_name", content: siteName },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: path === "/" ? "website" : "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "2400" },
      { property: "og:image:height", content: "1260" },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", type: "text/markdown", href: markdownUrl(path) },
    ],
    scripts: [{ type: "application/ld+json", children: structuredData(title, description, path) }],
  };
}

export function openGraphImage(path: string) {
  const parts = path.split("/").filter(Boolean);
  const slug = parts[0] === "components" ? parts.at(-1) : parts.join("-");
  return `/og/${slug || "home"}.jpg`;
}

export function markdownUrl(path: string) {
  return path === "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`;
}
