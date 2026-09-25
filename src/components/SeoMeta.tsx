import { useEffect } from "react";

const siteUrl = "https://typekor.manethpak.dev";

const pageMeta = {
  learn: {
    title: "Khmer Typing Lessons | រៀនវាយអក្សរខ្មែរ | TypeKor",
    description:
      "Free Khmer typing lessons for beginners and advanced learners. រៀនវាយអក្សរខ្មែរតាមជំហាន និងហាត់ជាមួយក្ដារចុច NIDA។",
  },
  keyboard: {
    title: "Khmer NIDA Keyboard Guide | ប្លង់ក្ដារចុចខ្មែរ | TypeKor",
    description: "Learn the Khmer NIDA keyboard layout, including Base, Shift, and Right Alt layers. ស្វែងយល់ពីប្លង់ក្ដារចុចខ្មែរ និងរបៀបវាយអក្សរឱ្យបានត្រឹមត្រូវ។",
  },
  test: {
    title: "Khmer Typing Test | សាកល្បងវាយអក្សរខ្មែរ | TypeKor",
    description: "Take a free Khmer typing test to measure your speed and accuracy. សាកល្បងវាយអក្សរខ្មែរ ហាត់វាយ និងមើលលទ្ធផលភ្លាមៗ។",
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
    const pageUrl = `${siteUrl}/${page === "test" ? "test" : page === "learn" ? "learn" : "keyboard-guide"}`;
    ogUrl?.setAttribute("content", pageUrl);
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute("content", metadata.title);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute("content", metadata.description);
  }, [page]);

  return null;
}
