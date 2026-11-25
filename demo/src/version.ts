/**
 * The tablecraft version this demo actually runs.
 *
 * Injected by vite.config.ts from the *installed* package, not from the
 * demo's dependency range. The range is now `^4.2.0` — a floor, not a
 * version — and before that an exact pin that drifted four times because
 * nobody remembered to bump it. Reading what is installed means the badge
 * and the code can no longer disagree.
 */
declare const __TABLECRAFT_VERSION__: string

export const TABLECRAFT_VERSION = __TABLECRAFT_VERSION__
