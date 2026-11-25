import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * The tablecraft version this demo actually has installed.
 *
 * Not the dependency range in package.json: that is `^4.2.0`, a floor rather
 * than a version. The badge was previously derived from an exact pin and
 * drifted four separate times because nobody remembered to bump it.
 *
 * Read from disk rather than imported — tablecraft's `exports` map has no
 * `./package.json` entry, so a deep import is blocked. `exports` governs
 * module resolution, not the filesystem.
 *
 * Shared by vite.config.ts and vitest.config.ts: the demo has both, and
 * vitest does not load the vite config, so a `define` in one alone leaves the
 * other with an undefined global.
 */
export const installedTablecraftVersion: string = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./node_modules/@marvinackerman/tablecraft/package.json', import.meta.url)),
    'utf8'
  )
).version
