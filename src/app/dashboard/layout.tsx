import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'
import { getUserInfoForLayout } from './actions'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const userInfo = await getUserInfoForLayout()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userInfo={userInfo} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
