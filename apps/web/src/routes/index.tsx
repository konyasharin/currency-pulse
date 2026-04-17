import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t('home.title')}</h2>
      <p className="text-slate-400">{t('home.subtitle')}</p>
    </div>
  )
}
