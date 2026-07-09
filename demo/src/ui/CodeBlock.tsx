import { Highlight, themes } from 'prism-react-renderer'

export function CodeBlock({
  code,
  lineNumbers = false,
  className = 'text-[13px]',
}: {
  code: string
  lineNumbers?: boolean
  className?: string
}) {
  return (
    <Highlight theme={themes.nightOwl} code={code.trim()} language="tsx">
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`overflow-x-auto leading-relaxed ${className}`} style={{ ...style, background: 'transparent' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {lineNumbers && (
                <span className="mr-4 inline-block w-4 select-none text-right text-faint">{i + 1}</span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
