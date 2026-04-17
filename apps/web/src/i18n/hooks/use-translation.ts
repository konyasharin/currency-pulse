import { useTranslation as I18NUseTranslation } from 'react-i18next'
import type { KeyPrefix } from 'i18next'

export const useTranslation =  <TPrefix extends KeyPrefix<'translation'>>(keyPrefix?: TPrefix) => {
  const { t } = I18NUseTranslation<'translation', TPrefix>('translation', { keyPrefix })
  return t
}