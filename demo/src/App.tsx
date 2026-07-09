import { Hero } from './Hero'
import { WhySection } from './sections/WhySection'
import { CoreSection } from './sections/CoreSection'
import { EditingSection } from './sections/EditingSection'
import { VirtualSection } from './sections/VirtualSection'
import { FeatureStrip } from './FeatureStrip'
import { Contribute } from './Contribute'

export default function App() {
  return (
    <>
      <div className="aurora" aria-hidden />

      <nav className="sticky top-0 z-30 border-b border-line/60 bg-canvas/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            tablecraft<span className="text-accent">.</span>
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden font-mono text-xs text-faint sm:inline">v2.5.0 · MIT</span>
            <a
              className="text-muted transition-colors hover:text-ink"
              href="https://github.com/Marvinkwame/Tablecraft"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="text-muted transition-colors hover:text-ink"
              href="https://www.npmjs.com/package/@marvinackerman/tablecraft"
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </div>
        </div>
      </nav>

      <div id="app-root" className="mx-auto max-w-6xl px-6 pb-24">
        <Hero />
        <WhySection />
        <CoreSection />
        <EditingSection />
        <VirtualSection />
        <FeatureStrip />
        <Contribute />

        <footer className="mt-28 flex flex-col items-start justify-between gap-3 border-t border-line pt-8 text-sm text-muted sm:flex-row sm:items-center">
          <span>
            Built with <span className="text-ink">tablecraft</span> — a wrapper around{' '}
            <a
              className="text-accent-soft hover:underline"
              href="https://tanstack.com/table"
              target="_blank"
              rel="noreferrer"
            >
              TanStack Table
            </a>
            .
          </span>
          <span className="font-mono text-xs text-faint">MIT · by Marvin</span>
        </footer>
      </div>
    </>
  )
}
