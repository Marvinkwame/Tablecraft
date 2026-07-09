import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

// The App mounts the VirtualSection, which builds a 50,000-row table model.
// Render it ONCE and run every smoke assertion against that single tree —
// re-rendering the full App per assertion multiplies that 50k model and
// exhausts the jsdom worker's heap for no added coverage.
describe('App smoke test', () => {
  it('renders the hero, core table, code peek, and all sections', () => {
    const { container } = render(<App />)

    // Hero pitch
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/TanStack Table/i)

    // Core table: column header + at least one data cell with an example email
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/@example\.com/).length).toBeGreaterThan(0)

    // "Show code" reveals the tablecraft snippet. The syntax highlighter splits
    // code into per-token <span>s, so match on the revealed <pre>'s textContent.
    const [firstShowCode] = screen.getAllByRole('button', { name: /show code/i })
    fireEvent.click(firstShowCode)
    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre?.textContent).toContain('useTable(')

    // Virtualization section is present (jsdom can't measure the scroll
    // container, so we assert the heading rather than virtualized row counts)
    expect(screen.getByRole('heading', { name: /virtualization/i })).toBeInTheDocument()
  })
})
