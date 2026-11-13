# elijahwalker.dev

Source for [elijahwalker.dev](https://elijahwalker.dev), my portfolio. It's laid out like a record sleeve: the cover (portrait and name), engineering projects, liner notes (About and Resume), and the studio for drawings, photographs, and music. Projects sits on a graph grid, and Studio shows each group as a film row that drifts slowly across the window. Each project also has its own page at `/projects/<id>/`.

Built with [Astro](https://astro.build), deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml` on every push to `main`.

## Editing content

Everything you'd normally change lives in `content/` as plain YAML. Edit a file on GitHub (pencil icon), commit, and the site updates in about a minute.

| What | File |
|---|---|
| Name, headline, email, links, About text, contact text, resume PDF | `content/profile.yaml` |
| Projects (homepage list and one page each) | `content/projects.yaml` |
| Drawings, photographs, music | `content/studio.yaml` |
| Media and design pieces (hidden until a piece has an image) | `content/media.yaml` |
| Experience, education, skills | `content/resume.yaml` |
| Lab notes list | `content/notes.yaml` |
| Now list | `content/now.yaml` |

Files like images and PDFs go in `public/` (for example `public/studio/sketch.webp`, referenced as `/studio/sketch.webp`).

Empty values hide things instead of showing a placeholder: a project with `links: []` shows no link, a media piece with no `image` stays hidden, an empty `resume_pdf` hides the download button, and an empty list hides its part of the page (and its nav link, if the whole section is empty).

### Studio images

Each drawing or photo in `content/studio.yaml` has a `title` (read aloud by screen readers), an `image` (the thumbnail in the film strip, about 560 px tall), an optional `full` (the full-size file the frame links to), and `width`/`height` (the full image's pixel size). The width and height set the frame's shape, so nothing gets cropped. The `drawings` list shows as Digital art and `photos` as Photography. A frame with a `full` image opens in the image viewer (arrows, swipe, Esc or Back to close).

### Project icons

In `content/projects.yaml`, `icon` is either a built-in name (`chart`, `calendar`, `database`, `chat`, `scatter`, `tag`, `record`) or a path to your own image in `public/icons/`, like `/icons/hermes.png`. A misspelled name stops the build with a message listing the valid names.

## Running it locally

```sh
npm install
npm run dev
```

Then open http://localhost:4321.

## Layout

- `src/pages/index.astro`: the homepage. `src/pages/projects/[id].astro`: one page per project. `src/pages/404.astro`: not found.
- `src/layouts/Base.astro`: the shared head, header, and footer.
- `src/components/`: `Icon` (project icons), `ProjectName` (icon + name link), `FilmStrip` (studio strips), `Reel` (studio film rows), `Viewer` (studio image viewer), `HermesDiagram`.
- `src/styles/tokens.css`: every color (light and dark), type size, space, radius, and motion timing. Change the look here first.
- `src/styles/base.css`, `components.css`, `pages.css`, `sections.css` (the Projects grid), `motion.css`: the styles, all reading from the tokens.
- `src/scripts/theme.js`: light/dark toggle. `jump.js`: header links fade out, jump, and fade in without adding #section to the address, and the header marks the section in view. `home.js`: copy-email button and image fallbacks. `viewer.js`: studio image viewer. `reel.js`: the drifting studio rows (pause button, hover, drag).
- `src/lib/content.js`: loads the YAML.
- `PRODUCT.md`: who the site is for and the design decisions behind it.
