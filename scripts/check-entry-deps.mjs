// Guards the dependency boundary of each published entry point.
//
// The root entry must be importable with only the *required* peers installed.
// Optional peers (@tanstack/react-query) may only be reached from the subpath
// entry that exists to house them — otherwise `import '@marvinackerman/tablecraft'`
// throws ERR_MODULE_NOT_FOUND for every consumer who never opted into that feature.
//
// Bundlers tree-shake unused *code*, but a static import must still *resolve*,
// so re-exporting a react-query hook from the root breaks the install regardless
// of whether the consumer calls it. This walks the real emitted module graph
// (entry → relative chunks) and inspects the bare specifiers it reaches.
//
// Three invariants are enforced:
//   1. Per-entry allow/deny lists (RULES below) — keeps optional peers confined.
//   2. Every package any entry imports is declared in the manifest — an
//      undeclared import installs cleanly and fails at the consumer's runtime.
//   3. Every peerDependenciesMeta key exists in peerDependencies — npm only
//      applies the meta to declared peers, so an orphaned entry is silently inert.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/** Each entry, the bare specifiers it must never reach, and those it must reach. */
const RULES = [
  {
    entries: ['dist/src/index.mjs', 'dist/src/index.js'],
    forbidden: ['@tanstack/react-query', '@tanstack/react-virtual'],
    required: [],
  },
  {
    entries: ['dist/query/index.mjs', 'dist/query/index.js'],
    forbidden: [],
    // If a split ever silently stops emitting its code, the root guard above
    // would still pass while the feature vanished. Assert the other half.
    required: ['@tanstack/react-query'],
  },
  {
    entries: ['dist/virtual/index.mjs', 'dist/virtual/index.js'],
    forbidden: [],
    required: ['@tanstack/react-virtual'],
  },
]

/** Every entry the package publishes, for the manifest-wide declaration check. */
const ALL_ENTRIES = [
  'dist/src/index',
  'dist/query/index',
  'dist/virtual/index',
  'dist/zod/index',
  'dist/devtools/index',
  'dist/testing/index',
].flatMap((base) => [`${base}.mjs`, `${base}.js`])

const IMPORT_RE = /(?:from\s*|import\s*|require\(\s*)['"]([^'"]+)['"]/g

/** `@scope/pkg/sub` → `@scope/pkg`, `pkg/sub` → `pkg` (e.g. react/jsx-runtime → react). */
function toPackageName(specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

/** Walk an entry's emitted module graph, returning every bare specifier reached. */
function collectBareSpecifiers(entryPath) {
  const seen = new Set()
  const bare = new Set()
  const queue = [resolve(entryPath)]

  while (queue.length > 0) {
    const file = queue.pop()
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)

    const contents = readFileSync(file, 'utf8')
    for (const [, specifier] of contents.matchAll(IMPORT_RE)) {
      if (specifier.startsWith('.')) {
        queue.push(resolve(dirname(file), specifier))
      } else {
        bare.add(specifier)
      }
    }
  }

  return bare
}

let failed = false

for (const { entries, forbidden, required } of RULES) {
  for (const entry of entries) {
    if (!existsSync(entry)) {
      console.error(`check-entry-deps: missing expected build output ${entry}`)
      failed = true
      continue
    }

    const reached = collectBareSpecifiers(entry)

    for (const specifier of forbidden) {
      if (reached.has(specifier)) {
        console.error(
          `check-entry-deps: ${entry} statically imports "${specifier}", ` +
          `which is an optional peer — consumers without it installed cannot import this entry.`
        )
        failed = true
      }
    }

    for (const specifier of required) {
      if (!reached.has(specifier)) {
        console.error(
          `check-entry-deps: ${entry} no longer imports "${specifier}" — ` +
          `the subpath entry is expected to be the only place that does.`
        )
        failed = true
      }
    }
  }
}

// ─── Invariant 2: every imported package is declared in the manifest ──────
//
// An import of a package that appears nowhere in the manifest installs without
// a single warning and then fails at the consumer's runtime or build.

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const peerDeps = pkg.peerDependencies ?? {}
const peerMeta = pkg.peerDependenciesMeta ?? {}
const declared = new Set([
  ...Object.keys(peerDeps),
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
])

const imported = new Set()
for (const entry of ALL_ENTRIES) {
  if (!existsSync(entry)) continue
  for (const specifier of collectBareSpecifiers(entry)) {
    if (specifier.startsWith('node:')) continue
    imported.add(toPackageName(specifier))
  }
}

for (const name of [...imported].sort()) {
  if (!declared.has(name)) {
    console.error(
      `check-entry-deps: "${name}" is imported by a published entry but is not declared ` +
      `in peerDependencies/dependencies — consumers get no install warning and it fails at runtime.`
    )
    failed = true
  }
}

// ─── Invariant 3: peerDependenciesMeta only describes declared peers ──────
//
// npm applies peerDependenciesMeta to entries in peerDependencies. A meta key
// with no matching peer is inert: it neither marks anything optional nor
// declares the package, so it reads as handled while doing nothing.

for (const name of Object.keys(peerMeta)) {
  if (!(name in peerDeps)) {
    console.error(
      `check-entry-deps: "${name}" appears in peerDependenciesMeta but not in peerDependencies — ` +
      `npm ignores the entry entirely, so the package is undeclared rather than optional.`
    )
    failed = true
  }
}

if (failed) {
  console.error('check-entry-deps: FAILED — entry points and manifest disagree about dependencies.')
  process.exit(1)
}
console.log('check-entry-deps: OK')
