import type { FC, ReactNode } from 'react'
import { cn } from '@currency-pulse/ui'
import { Logo } from '../logo'
import { useTranslation } from '@/i18n'

interface SidebarProps {
  children?: ReactNode;
  className?: string;
}

export const Sidebar: FC<SidebarProps> = props => {
  const t = useTranslation()

  return (
    <div className={cn('bg-[#080808] h-screen', props.className)}>
      <div className={'flex items-center gap-[12px] font-[600] text-[18px] tracking-[1px] mb-[20px]'}>
        <Logo />
        <h1>{t('common.appName')}</h1>
      </div>
      {props.children}
    </div>
  );
};
