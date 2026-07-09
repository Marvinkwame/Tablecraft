import { CoreSection } from './sections/CoreSection'
import { EditingSection } from './sections/EditingSection'
import { VirtualSection } from './sections/VirtualSection'

export default function App() {
  return (
    <div id="app-root" className="min-h-screen mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold">tablecraft</h1>
      <CoreSection />
      <EditingSection />
      <VirtualSection />
    </div>
  )
}
