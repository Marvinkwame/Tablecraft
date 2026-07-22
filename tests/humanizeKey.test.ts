import { describe, it, expect } from 'vitest'
import { humanizeKey } from '../src/utils/humanizeKey'

describe('humanizeKey', () => {
  it('splits camelCase into words', () => {
    expect(humanizeKey('firstName')).toBe('First Name')
  })

  it('replaces snake_case and kebab-case separators', () => {
    expect(humanizeKey('created_at')).toBe('Created At')
    expect(humanizeKey('last-active')).toBe('Last Active')
  })

  it('capitalizes a single lowercase word', () => {
    expect(humanizeKey('email')).toBe('Email')
  })

  it('leaves an already-capitalized word unchanged', () => {
    expect(humanizeKey('Role')).toBe('Role')
  })

  it('returns an empty string unchanged', () => {
    expect(humanizeKey('')).toBe('')
  })
})
