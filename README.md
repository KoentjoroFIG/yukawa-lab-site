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
| Members                       | `src/_data/members.yaml`      |
| Research themes               | `src/_data/research.yaml`     |
| Funding                       | `src/_data/funding.yaml`      |
| Email, address, links         | `src/_data/site.yaml`         |

Each file has instructions at the top. The usual pattern is to copy the first
block, paste it above itself, and edit it.

- **Member photos** go in `src/assets/img/people/`, ideally 480×512 px. The
  site applies the violet/pink duotone automatically. Members without a photo
  get an initials tile.
- **Featured papers**: add `featured: true` to show a paper on the home page.
  Four is a good number.

Commit and push to `main`. GitHub builds and publishes the site in about a
minute.

## Running locally

Requires Node.js 18 or newer.

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
