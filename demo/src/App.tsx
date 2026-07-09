import { Hero } from './Hero'
import { CoreSection } from './sections/CoreSection'
import { EditingSection } from './sections/EditingSection'
import { VirtualSection } from './sections/VirtualSection'
import { FeatureStrip } from './FeatureStrip'

export default function App() {
  return (
    <div id="app-root" className="mx-auto max-w-6xl px-6 py-16">
      <Hero />
      <CoreSection />
      <EditingSection />
      <VirtualSection />
      <FeatureStrip />
      <footer className="mt-20 border-t border-line pt-8 text-sm text-muted">
        Built with tablecraft · MIT · by Marvin
      </footer>
    </div>
  )
}
