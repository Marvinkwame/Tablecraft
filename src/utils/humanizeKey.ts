/**
 * Convert an object key into a human-readable column header.
 * "firstName" → "First Name", "created_at" → "Created At"
 */
export function humanizeKey(key: string): string {
  return key
    // camelCase → spaced
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // snake_case / kebab-case → spaced
    .replace(/[_-]/g, ' ')
    // capitalize each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
