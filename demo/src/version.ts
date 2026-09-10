import pkg from '../package.json'

/**
 * The tablecraft version this demo actually installs, read from the demo's own
 * package.json rather than typed in by hand.
 *
 * The badge was hardcoded and sat at v2.5.0 across three releases while the
 * dependency moved on without it. Deriving it means the displayed version and
 * the installed one cannot disagree: bumping the dependency is now the only
 * thing needed to update the page.
 */
export const TABLECRAFT_VERSION = pkg.dependencies['@marvinackerman/tablecraft']
