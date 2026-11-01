# elijahwalker.dev

Source for [elijahwalker.dev](https://elijahwalker.dev), my portfolio. The hero is a small gravity-assist game: each planet is a section of the site, and hitting one with a probe unlocks it. There's a "Skip the game" button if you just want to read.

Built with [Astro](https://astro.build), deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml` on every push to `main`.

## Editing content

Everything you'd normally change lives in `content/` as plain YAML. Edit a file on GitHub (pencil icon), commit, and the site updates in about a minute.

| What | File |
|---|---|
| Name, headline, email, links, About text, contact text, resume PDF | `content/profile.yaml` |
| Projects (and the icon strip under the hero) | `content/projects.yaml` |
| Media and design pieces | `content/media.yaml` |
| Experience, education, skills | `content/resume.yaml` |
| Lab notes list | `content/notes.yaml` |
| Now list | `content/now.yaml` |

Files like images and PDFs go in `public/` (for example `public/media/firm-foundation.jpg`, referenced as `/media/firm-foundation.jpg`).

Empty values hide things instead of showing a placeholder: a project with `links: []` shows no link, a media piece with `image: ""` shows as text only, and an empty `resume_pdf` hides the download button.

### Project icons

In `content/projects.yaml`, `icon` is either a built-in name (`chart`, `calendar`, `database`, `chat`, `scatter`, `tag`) or a path to your own image in `public/icons/`, like `/icons/hermes.png`.

## Running it locally

```sh
npm install
npm run dev
```

Then open http://localhost:4321.

## Layout

- `src/pages/index.astro`: the page. Section order, titles, and planet colors are set at the top.
- `src/styles/site.css`: all styles, with light and dark palettes at the top.
- `src/scripts/site.js`: theme toggle, menu, the game, and the section unlocks.
- `src/components/Icon.astro`: built-in project icons.
