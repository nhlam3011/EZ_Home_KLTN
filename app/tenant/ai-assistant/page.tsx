'use client'

import AiAssistantPage from '@/components/AiAssistant'
import { BuildingProvider } from '@/components/BuildingContext'

export default function TenantAiAssistantPage() {
  return (
    <BuildingProvider>
      <AiAssistantPage role="TENANT" />
    </BuildingProvider>
  )
}
