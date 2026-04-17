import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Sidebar, SidebarNavigationElement } from '@/components/sidebar'
import { Icon } from '@currency-pulse/ui'
import { useTranslation } from '@/i18n'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const t = useTranslation('sidebar.links')

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <main className="grid grid-cols-6 ">
        <Sidebar className={'p-[20px]'}>
          <SidebarNavigationElement to={'/'}>
            <Icon.LayoutDashboard size={20} />
            <span className={'text-[16px] font-[600]'}>{t('converter')}</span>
          </SidebarNavigationElement>
          <SidebarNavigationElement to={'/alerts'}>
            <Icon.Activity size={20} />
            <span className={'text-[16px] font-[600]'}>{t('alerts')}</span>
          </SidebarNavigationElement>
          <SidebarNavigationElement to={'/favorites'}>
            <Icon.Archive size={20} />
            <span className={'text-[16px] font-[600]'}>{t('favorites')}</span>
          </SidebarNavigationElement>
          <SidebarNavigationElement to={'/settings'}>
            <Icon.Settings size={20} />
            <span className={'text-[16px] font-[600]'}>{t('settings')}</span>
          </SidebarNavigationElement>
        </Sidebar>
        <div className={'col-span-5 p-[40px]'}>
          <Outlet />
        </div>
      </main>
      <TanStackRouterDevtools />
    </div>
  )
}
