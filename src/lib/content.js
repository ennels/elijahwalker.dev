// Loads the site's YAML content once, for every page and component.
// All editable content lives in content/*.yaml; see the README.
import yaml from 'js-yaml';
import profileRaw from '../../content/profile.yaml?raw';
import projectsRaw from '../../content/projects.yaml?raw';
import mediaRaw from '../../content/media.yaml?raw';
import resumeRaw from '../../content/resume.yaml?raw';
import notesRaw from '../../content/notes.yaml?raw';
import nowRaw from '../../content/now.yaml?raw';
import studioRaw from '../../content/studio.yaml?raw';

export const profile = yaml.load(profileRaw);
export const projects = yaml.load(projectsRaw) ?? [];
// Media and design pieces show only once they have an image; text-only entries wait in the YAML.
export const media = (yaml.load(mediaRaw) ?? []).filter((m) => m.image);
export const resume = yaml.load(resumeRaw);
export const notes = yaml.load(notesRaw) ?? { items: [] };
export const now = yaml.load(nowRaw) ?? { items: [] };

// Studio items only show once their file exists in the YAML; nothing ships as a placeholder.
const rawStudio = yaml.load(studioRaw) ?? {};
export const studio = {
  drawings: (rawStudio.drawings ?? []).filter((d) => d.image),
  photos: (rawStudio.photos ?? []).filter((p) => p.image),
  music: (rawStudio.music ?? []).filter((m) => m.audio),
};

export const SITE = 'https://elijahwalker.dev';
export const projectHref = (id) => `/projects/${id}/`;

// Sections with nothing in them hide, and leave the nav with them.
export const hasStudio = () => studio.drawings.length + studio.photos.length + studio.music.length + media.length > 0;
export const navItems = () => [
  ...(projects.length ? [['projects', 'Projects']] : []),
  ['about', 'About'],
  ['resume', 'Resume'],
  ...(hasStudio() ? [['studio', 'Studio']] : []),
  ['contact', 'Contact'],
];
