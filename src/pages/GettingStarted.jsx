import TopAppBar from '../components/layout/TopAppBar'

const steps = [
  {
    icon: 'home',
    title: 'Start on Home',
    text: 'Browse Categories to jump into a subject, or scroll down to see what\'s trending and recently added.',
  },
  {
    icon: 'search',
    title: 'Search anytime',
    text: 'Tap Search in the bottom bar. Your past searches are saved so you can jump back into one, and category tiles help you browse without typing.',
  },
  {
    icon: 'auto_stories',
    title: 'Filter in Library',
    text: 'Library lets you filter by type — Books, Papers, Devotionals, Media — using the tabs under the search bar.',
  },
  {
    icon: 'add_box',
    title: 'Contribute a resource',
    text: 'From Contribute: Request Material if you can\'t find something, Suggest Material to recommend a title, or Submit Resource to upload your own file in three steps.',
  },
  {
    icon: 'download_for_offline',
    title: 'Save for offline',
    text: 'Anything you download appears under Profile → Downloads, with in-progress downloads shown separately from completed ones.',
  },
]

function GettingStarted() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Getting Started" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
          A quick walkthrough of how the library actually works.
        </p>

        <div className="flex flex-col gap-gutter">
          {steps.map((step, index) => (
            <div key={step.title} className="flex gap-4 p-stack-md rounded-xl bg-surface-container border border-outline">
              <div className="flex flex-col items-center flex-none">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">{step.icon}</span>
                </div>
                {index < steps.length - 1 && <div className="w-px flex-grow bg-outline mt-2" />}
              </div>
              <div className="pb-2">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface mb-1">{step.title}</h3>
                <p className="font-label-md text-label-md text-on-surface-variant">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default GettingStarted
