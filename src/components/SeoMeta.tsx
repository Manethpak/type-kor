import { useEffect } from "react";

const siteUrl = "https://typekor.manethpak.dev";

const pageMeta = {
  learn: {
    title: "រៀនវាយអក្សរខ្មែរ | Khmer Typing Lessons | TypeKor",
    description:
      "រៀនវាយអក្សរខ្មែរតាមជំហានជាមួយមេរៀនអនុវត្ត និងប្លង់ក្ដារចុច NIDA។ Khmer typing lessons for beginners and advanced learners.",
  },
  keyboard: {
    title: "ក្ដារចុចខ្មែរ NIDA | Khmer Keyboard Guide | TypeKor",
    description: "ស្វែងយល់ពីប្លង់ក្ដារចុចខ្មែរ NIDA ស្រទាប់ Base, Shift និង Right Alt ដើម្បីវាយអក្សរខ្មែរបានត្រឹមត្រូវ។",
  },
  test: {
    title: "សាកល្បងវាយអក្សរខ្មែរ | Khmer Typing Test | TypeKor",
    description: "សាកល្បងវាយអក្សរខ្មែរ និងវាស់ល្បឿននិងភាពត្រឹមត្រូវរបស់អ្នកជាមួយ TypeKor។",
  },
};

export function SeoMeta({ page }: { page: keyof typeof pageMeta }) {
  useEffect(() => {
    const metadata = pageMeta[page];
    document.title = metadata.title;

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", metadata.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute(
      "href",
      `${siteUrl}/${page === "test" ? "test" : page === "learn" ? "learn" : "keyboard-guide"}`,
    );

    const ogTitle = document.querySelector('meta[property="og:title"]');
    ogTitle?.setAttribute("content", metadata.title);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    ogDescription?.setAttribute("content", metadata.description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    ogUrl?.setAttribute(
      "content",
      `${siteUrl}/${page === "test" ? "test" : page === "learn" ? "learn" : "keyboard-guide"}`,
    );
  }, [page]);

  return null;
}
