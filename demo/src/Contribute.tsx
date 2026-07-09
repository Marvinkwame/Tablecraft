import { buttonClasses } from './ui/Button'

const REPO = 'https://github.com/Marvinkwame/Tablecraft'

export function Contribute() {
  return (
    <section className="reveal mt-28 overflow-hidden rounded-2xl border border-line bg-surface/50 px-6 py-12 text-center backdrop-blur-sm sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none mx-auto -mb-12 h-24 w-64 rounded-full bg-accent/20 blur-[80px]"
      />
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Have an idea, or found a bug?
      </h2>
      <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">
        tablecraft is open source and MIT-licensed. Feature requests, bug reports, and questions are all
        welcome on GitHub — the good ones ship.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a className={buttonClasses('solid')} href={`${REPO}/issues/new`} target="_blank" rel="noreferrer">
          Suggest a feature ↗
        </a>
        <a className={buttonClasses('ghost')} href={`${REPO}/issues`} target="_blank" rel="noreferrer">
          Browse issues
        </a>
        <a className={buttonClasses('ghost')} href={REPO} target="_blank" rel="noreferrer">
          Star on GitHub ★
        </a>
      </div>
    </section>
  )
}
