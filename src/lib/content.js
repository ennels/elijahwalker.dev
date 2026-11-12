// Loads the site's YAML content once, for every page and component.
// All editable content lives in content/*.yaml; see the README.
import yaml from 'js-yaml';
import profileRaw from '../../content/profile.yaml?raw';
import projectsRaw from '../../content/projects.yaml?raw';
import mediaRaw from '../../content/media.yaml?raw';
import resumeRaw from '../../content/resume.yaml?raw';
import notesRaw from '../../content/notes.yaml?raw';
import nowRaw from '../../content/now.yaml?raw';

export const profile = yaml.load(profileRaw);
export const projects = yaml.load(projectsRaw) ?? [];
export const media = yaml.load(mediaRaw) ?? [];
export const resume = yaml.load(resumeRaw);
export const notes = yaml.load(notesRaw) ?? { items: [] };
export const now = yaml.load(nowRaw) ?? { items: [] };

export const SITE = 'https://elijahwalker.dev';
export const projectHref = (id) => `/projects/${id}/`;

// Sections with nothing in them hide, and leave the nav with them.
export const hasStudio = () => media.length > 0;
export const navItems = () => [
  ...(projects.length ? [['projects', 'Projects']] : []),
  ['about', 'About'],
  ['resume', 'Resume'],
  ...(hasStudio() ? [['studio', 'Studio']] : []),
  ['contact', 'Contact'],
];
