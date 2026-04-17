import { Icon } from '@currency-pulse/ui';
import type { FC } from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: FC<LogoProps> = props => {
  return (
    <Icon.Zap color={'#00ff88'} width={20} height={20} {...props} />
  );
};
