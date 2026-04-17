import type { FC, ReactNode } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'

interface SidebarNavigationElementProps {
  to: string
  children?: ReactNode
}

export const SidebarNavigationElement: FC<SidebarNavigationElementProps> = props => {
  const matchRoute = useMatchRoute()
  const isActive = !!matchRoute({ to: props.to })

  return (
    <Link
      to={props.to}
      className={'flex gap-[12px] p-[12px] items-center uppercase tracking-[1px] relative transition'}
      activeProps={{ className: 'text-[#00ff88]' }}
    >
      {isActive && (
        <motion.div
          layoutId='sidebar-active'
          className='absolute left-0 top-0 rounded-[12px] bg-[#00ff8810] w-full h-full'
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      )}
      {props.children}
    </Link>
  );
};
