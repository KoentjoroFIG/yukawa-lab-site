import yaml from "js-yaml";
import { HtmlBasePlugin } from "@11ty/eleventy";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

const escapeHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isPI = (author) => /yukawa/i.test(author);

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Every page is English unless its directory data says otherwise (src/ja/).
  // `base` is the URL prefix for the page's language.
  eleventyConfig.addGlobalData("lang", "en");
  eleventyConfig.addGlobalData("base", "");

  // "2026-06" -> "June 2026" or "2026年6月"
  eleventyConfig.addFilter("monthYear", (value, lang = "en") => {
    const [year, month] = String(value).split("-");
    if (!month) return year;
    return lang === "ja" ? `${year}年${Number(month)}月` : `${MONTHS[Number(month) - 1]} ${year}`;
  });

  // A field in the page's language: obj.text_ja on Japanese pages when it
  // exists, otherwise obj.text.
  eleventyConfig.addFilter("loc", (obj, field, lang = "en") =>
    lang !== "en" && obj?.[`${field}_${lang}`] != null ? obj[`${field}_${lang}`] : obj?.[field]);

  // Fill {placeholders} in interface text: "{n} papers" | fill({ n: 20 })
  eleventyConfig.addFilter("fill", (text, vars = {}) =>
    String(text).replace(/\{(\w+)\}/g, (match, key) => key in vars ? vars[key] : match));

  // The same page in the other language.
  eleventyConfig.addFilter("otherLangUrl", (url, lang) =>
    lang === "ja" ? url.replace(/^\/ja(\/|$)/, "/") : `/ja${url}`);

  // Author list as HTML with the PI emphasised. Long lists are shortened to
  // the first three authors, the PI, and the last (senior) author.
  eleventyConfig.addFilter("authorList", (authors, max = 0) => {
    let shown = authors.map((name) => ({ name }));
    if (max && authors.length > max) {
      const keep = new Set([0, 1, 2, authors.length - 1, authors.findIndex(isPI)]);
      shown = [];
      authors.forEach((name, i) => {
        if (keep.has(i)) shown.push({ name });
        else if (shown.at(-1)?.gap !== true) shown.push({ gap: true });
      });
    }
    return shown
      .map((a) => a.gap ? "…" : isPI(a.name) ? `<strong>${escapeHtml(a.name)}</strong>` : escapeHtml(a.name))
      .join(", ");
  });

  eleventyConfig.addFilter("pubUrl", (pub) => pub.doi
    ? `https://doi.org/${pub.doi}`
    : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${pub.title}"[Title]`)}`);

  eleventyConfig.addFilter("pubLinkLabel", (pub) => pub.doi ? "DOI" : "PubMed");

  eleventyConfig.addFilter("initials", (name) => name.split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join(""));

  // Newest `count` publications with a given topic (data is newest first).
  eleventyConfig.addFilter("byTopic", (pubs, topic, count = Infinity) =>
    pubs.filter((p) => p.topic === topic).slice(0, count));

  // [{ year, items }] in the order the years first appear.
  eleventyConfig.addFilter("groupByYear", (pubs) => {
    const groups = [];
    for (const pub of pubs) {
      if (groups.at(-1)?.year !== pub.year) groups.push({ year: pub.year, items: [] });
      groups.at(-1).items.push(pub);
    }
    return groups;
  });

  // Absolute site URL, set by the deploy workflow; used for share previews.
  eleventyConfig.addGlobalData("siteUrl", (process.env.SITE_URL || "").replace(/\/$/, ""));

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
  };
}
