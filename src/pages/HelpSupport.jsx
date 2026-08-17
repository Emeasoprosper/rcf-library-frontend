import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'

const quickLinks = [
  { icon: 'rocket_launch', title: 'Getting Started Guide', to: '/help/getting-started' },
  { icon: 'gavel', title: 'Licensing & Usage', to: '/help/licensing' },
  { icon: 'format_quote', title: 'Citation Tools', to: '/help/citation-tools' },
]

const tickets = []

function HelpSupport() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Support Center" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <div className="relative mb-stack-lg">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search common questions..."
            className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
          />
        </div>

        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            Common Questions
          </h2>
          <div className="flex flex-col gap-gutter">
            {quickLinks.map((link) => (
              <button
                key={link.title}
                onClick={() => navigate(link.to)}
                className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline hover:border-on-surface-variant transition-colors text-left"
              >
                <span className="material-symbols-outlined text-primary">{link.icon}</span>
                <h3 className="font-body-md text-body-md font-semibold text-on-surface flex-grow">{link.title}</h3>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-stack-sm">
            Active Support Tickets
          </h2>
          {tickets.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-md">
              No active support requests.
            </p>
          ) : (
            <div className="flex flex-col gap-gutter">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                  {ticket.subject}
                </div>
              ))}
            </div>
          )}
        </section>

        <button className="w-full py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all">
          Submit Inquiry
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

export default HelpSupport
