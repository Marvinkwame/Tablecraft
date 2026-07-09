import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Button } from './Button'

export function CodePeek({ code }: { code: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <Button onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Hide code' : 'Show code'}
      </Button>
      {open && (
        <Highlight theme={themes.vsDark} code={code.trim()} language="tsx">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="mt-2 overflow-x-auto rounded-lg border border-line p-4 text-xs leading-relaxed"
              style={{ ...style, background: 'var(--color-canvas)' }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  )
}
