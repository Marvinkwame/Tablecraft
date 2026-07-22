// Guards against declaration-emit leaking Zod-major-specific or internal types
// into the published .d.ts. `z.core` exists only in Zod 4, so emitting it would
// break every Zod 3 consumer's types — see the zodValidator return annotation.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const FORBIDDEN = [/\bz\.core\b/, /\b_zod\b/, /\b_def\b/]
const dir = 'dist/zod'
let failed = false

for (const file of readdirSync(dir).filter((f) => f.endsWith('.d.ts') || f.endsWith('.d.mts'))) {
  const contents = readFileSync(join(dir, file), 'utf8')
  for (const pattern of FORBIDDEN) {
    if (pattern.test(contents)) {
      console.error(`check-dts: ${join(dir, file)} contains forbidden type reference ${pattern}`)
      failed = true
    }
  }
}

if (failed) {
  console.error('check-dts: FAILED — the published types must not reference Zod internals or a specific Zod major.')
  process.exit(1)
}
console.log('check-dts: OK')
