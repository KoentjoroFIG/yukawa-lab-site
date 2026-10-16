# Yukawa Lab website

Static site for the Yukawa Lab (Chromatin Biology, Ehime University), built
with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

## Updating content

All content lives in YAML files in `src/_data/`. You never need to touch the
HTML, CSS or JavaScript to keep the site current.

| To change…                    | Edit                          |
|-------------------------------|-------------------------------|
| News                          | `src/_data/news.yaml`         |
| Publications                  | `src/_data/publications.yaml` |
| Members and their profiles    | `src/_data/members.yaml`      |
| Research themes               | `src/_data/research.yaml`     |
| Publication topics (filters)  | `src/_data/topics.yaml`       |
| Funding                       | `src/_data/funding.yaml`      |
| Email, Facebook, scholarship link | `src/_data/site.yaml`     |
| Lab name, address, buttons, headings (both languages) | `src/_data/i18n.yaml` |

The site has four pages in English (`/`, `/people/`, `/publications/`,
`/news/`) and the same four in Japanese under `/ja/`. They all read from the
same files, so a paper added once appears everywhere it should.

### Japanese

Any text field can have a Japanese twin with `_ja` added to its name, right
next to the English one:

```yaml
- date: "2026-06"
  text: Razil Bin Tahir joined the lab.
  text_ja: Razil Bin Tahirさんが研究室に加わりました。
```

- If a `_ja` field is missing, the Japanese site shows the English text, so
  nothing ever appears blank.
- Keep Japanese text **on one line**. YAML's folded `>-` style joins lines with
  a space, which puts stray spaces into Japanese sentences.
- Use the full-width colon `：` in Japanese text. A half-width `:` at the end of
  a line breaks the YAML file.
- Paper titles, author names, and members' degrees and past positions stay in
  English on both sites.

Each file has instructions at the top. The usual pattern is to copy the first
block, paste it above itself, and edit it.

- **Member photos** go in `src/assets/img/people/`, ideally 480×512 px. The
  site applies the violet/pink duotone automatically. Members without a photo
  get an initials tile.
- **Featured papers**: add `featured: true` to show a paper on the home page.
  Four is a good number.
- **Topics**: give each paper a `topic` (`t-cells`, `disease` or
  `development`). It drives the filter on the Publications page, and the two
  newest papers in a research theme's topic appear under it as key papers.
- **Share previews**: `src/assets/img/og.png` (English) and `og-ja.png`
  (Japanese) are the images shown when the site is linked on LINE, Facebook,
  Slack, etc. If you change a headline, regenerate the matching image with a
  1200×630 screenshot of the hero.

Commit and push to `main`. GitHub builds and publishes the site in about a
minute.

## Running locally

Requires Node.js 20 or newer (the deploy uses 24).

```sh
npm install
npm start        # http://localhost:8080, reloads on save
npm run build    # writes the site to _site/
```

## First-time GitHub Pages setup

1. Push this folder to a GitHub repository.
2. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
   deploys the site, and handles the `/<repo-name>/` path prefix for you.

## Design notes

- Colours come from H&E staining: hematoxylin violet (`--ink`) and eosin pink
  (`--eosin`). The tokens are at the top of `src/assets/css/site.css`.
- The type is Archivo throughout. Headlines use its expanded width (`--wide`).
- The hero animation is `src/assets/js/chromatin.js`. It respects the
  reduced-motion setting and pauses when off screen.
