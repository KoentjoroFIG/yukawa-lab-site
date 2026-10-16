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

  // "2026-06" -> "June 2026"
  eleventyConfig.addFilter("monthYear", (value) => {
    const [year, month] = String(value).split("-");
    return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
  });

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

  eleventyConfig.addFilter("initials", (name) => name.split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join(""));

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
  };
}
