import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the hero pitch', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/TanStack Table/i)
  })

  it('renders the core table with employee rows', () => {
    render(<App />)
    // Column header + at least one data cell containing an example email
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/@example\.com/).length).toBeGreaterThan(0)
  })

  it('reveals a code snippet when "Show code" is clicked', () => {
    const { container } = render(<App />)
    const [firstShowCode] = screen.getAllByRole('button', { name: /show code/i })
    fireEvent.click(firstShowCode)
    // The syntax highlighter splits code into per-token <span>s, so match on the
    // textContent of the revealed <pre> block rather than a single text node.
    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre?.textContent).toContain('useTable(')
  })

  it('renders the virtualization section heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /virtualization/i })).toBeInTheDocument()
  })
})
