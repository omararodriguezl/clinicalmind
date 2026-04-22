import { Sidebar, MobileNav } from './Sidebar'
import { Header } from './Header'

function ClassificationRibbon() {
  return (
    <div className="classification-ribbon flex-shrink-0">
      CUI // CLINICALMIND // CONTROLLED CLINICAL USE // FOR AUTHORIZED PERSONNEL ONLY
    </div>
  )
}

export function Layout({ children, title, headerActions, backButton }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ClassificationRibbon />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header title={title} actions={headerActions} backButton={backButton} />

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
