import { Sidebar, MobileNav } from './Sidebar'
import { Header } from './Header'

export function Layout({ children, title, headerActions, backButton }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} actions={headerActions} backButton={backButton} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
