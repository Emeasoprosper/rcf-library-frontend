import TopAppBar from '../components/layout/TopAppBar'

function CitationTools() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Citation Tools" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <div className="flex flex-col items-center text-center py-stack-lg">
          <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">
            format_quote
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Not available yet</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
            APA/MLA citation generation isn't built yet. For now, use the Author, Title, and Publisher shown on each resource's detail page to cite manually.
          </p>
        </div>
      </main>
    </div>
  )
}

export default CitationTools
