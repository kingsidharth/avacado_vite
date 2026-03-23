import type { ComponentType } from 'react'
import PromptComparison from '@/components/lesson/interactives/PromptComparison'
import PromptSwipe from '@/components/lesson/interactives/PromptSwipe'
import PromptAnatomy from '@/components/lesson/interactives/PromptAnatomy'
import TechniqueExplorer from '@/components/lesson/interactives/TechniqueExplorer'
import TechniqueMatching from '@/components/lesson/interactives/TechniqueMatching'
import FillTheBlueprint from '@/components/lesson/interactives/FillTheBlueprint'
import ScoredPromptBuilder from '@/components/lesson/interactives/ScoredPromptBuilder'
import TechniqueToolkit from '@/components/lesson/interactives/TechniqueToolkit'
import ColdOpenQuiz from '@/components/lesson/interactives/ColdOpenQuiz'
import RAGPipelineExplorer from '@/components/lesson/interactives/RAGPipelineExplorer'
import DocumentUploader from '@/components/lesson/interactives/DocumentUploader'
import RAGQueryLab from '@/components/lesson/interactives/RAGQueryLab'
import SpotTheGap from '@/components/lesson/interactives/SpotTheGap'
import PromptUpgradeLab from '@/components/lesson/interactives/PromptUpgradeLab'
import BuildAPrompt from '@/components/lesson/interactives/BuildAPrompt'
import RateAndRefine from '@/components/lesson/interactives/RateAndRefine'
import PersonaliseMessage from '@/components/lesson/interactives/PersonaliseMessage'
import MultiSelectQuiz from '@/components/lesson/interactives/MultiSelectQuiz'
import RankingExercise from '@/components/lesson/interactives/RankingExercise'
import RoutineBuilder from '@/components/lesson/interactives/RoutineBuilder'

// ============================================================================
// Component Registry — populated as interactive components are created
// ============================================================================

const componentRegistry: Record<string, ComponentType<Record<string, unknown>>> = {
  PromptComparison,
  PromptSwipe,
  PromptAnatomy,
  TechniqueExplorer,
  TechniqueMatching,
  FillTheBlueprint,
  ScoredPromptBuilder,
  TechniqueToolkit,
  ColdOpenQuiz,
  RAGPipelineExplorer,
  DocumentUploader,
  RAGQueryLab,
  SpotTheGap,
  PromptUpgradeLab,
  BuildAPrompt,
  RateAndRefine,
  PersonaliseMessage,
  MultiSelectQuiz,
  RankingExercise,
  RoutineBuilder,
}

// ============================================================================
// Types
// ============================================================================

interface InteractiveHeroProps {
  component: string
  props?: Record<string, unknown>
  onActivityComplete?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function InteractiveHero({ component, props, onActivityComplete }: InteractiveHeroProps) {
  const Component = componentRegistry[component]

  if (!Component) {
    return (
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-muted p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Interactive: {component}
          </p>
          <p className="text-xs text-muted-foreground">Component not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden rounded-2xl">
      <Component {...(props ?? {})} onActivityComplete={onActivityComplete} />
    </div>
  )
}
