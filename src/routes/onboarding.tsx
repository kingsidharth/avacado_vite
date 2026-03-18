import { useState, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { animate, createScope } from 'animejs'
import { SignedInGuard } from '@/components/auth/AuthGuards'
import { useAppUserProfile } from '@/hooks/useAppUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioQuestion } from '@/components/quiz/RadioQuestion'
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar'
import { OnboardingMascotBubble } from '@/components/onboarding/OnboardingMascotBubble'
import { OnboardingErrorBoundary } from '@/components/onboarding/OnboardingErrorBoundary'
import { LearningScreenLayout } from '@/components/learning/layout/LearningScreenLayout'
import { ContentColumn } from '@/components/learning/layout/ContentColumn'
import { Stack } from '@/components/learning/layout/Stack'
import { StickyPrimaryCTA } from '@/components/learning/StickyPrimaryCTA'
import { MascotBlob } from '@/components/mascot/MascotBlob'
import { DEFAULT_OUTER_BLOBS } from '@/components/mascot/mascot-blob-config'
import { apiRequest } from '@/lib/api/client'
import type { OnboardingInput } from '@/types/api'
import type { Option } from '@/types/quiz'

type Profession = 'student' | 'freelancer' | 'founder' | 'business_owner' | 'working_professional' | 'others'
type StepKey = 'profession' | 'companyWebsite' | 'jobTitle' | 'aiKnowledge' | 'timeCommitment' | 'preferredTiming'

type Frequency = 'daily' | 'weekly' | 'weekend' | 'monthly'
type Timing = 'morning' | 'lunch' | 'evening' | 'night'

const PROFESSION_OPTIONS: Option[] = [
  { id: 'student', text: 'Student' },
  { id: 'freelancer', text: 'Freelancer' },
  { id: 'founder', text: 'Founder' },
  { id: 'business_owner', text: 'Business owner' },
  { id: 'working_professional', text: 'Working professional' },
  { id: 'others', text: 'Others' },
]

const AI_KNOWLEDGE_OPTIONS: Option[] = [
  { id: '0', text: 'I am not sure' },
  { id: '1', text: 'Beginner' },
  { id: '2', text: 'Basic' },
  { id: '3', text: 'Intermediate' },
  { id: '4', text: 'Advanced' },
]

const TIME_SPAN_OPTIONS = [5, 10, 15, 20, 30] as const
const FREQUENCY_OPTIONS: Option[] = [
  { id: 'daily', text: 'Daily' },
  { id: 'weekly', text: 'Weekly' },
  { id: 'weekend', text: 'Weekend' },
  { id: 'monthly', text: 'Monthly' },
]

const TIMING_OPTIONS: Option[] = [
  { id: 'morning', text: 'Morning' },
  { id: 'lunch', text: 'Afternoon' },
  { id: 'evening', text: 'Evening' },
  { id: 'night', text: 'Night' },
]

function buildSteps(profession: Profession | null): StepKey[] {
  const steps: StepKey[] = ['profession']
  if (profession && profession !== 'student') steps.push('companyWebsite')
  if (profession === 'working_professional') steps.push('jobTitle')
  steps.push('aiKnowledge', 'timeCommitment', 'preferredTiming')
  return steps
}

type OnboardingPhase = 'steps' | 'saving' | 'celebration' | 'exiting' | 'loading'

const REQUIRED_STEPS: Set<StepKey> = new Set(['profession', 'timeCommitment', 'preferredTiming'])

function OnboardingPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [phase, setPhase] = useState<OnboardingPhase>('steps')
  const [profession, setProfession] = useState<Profession | null>(null)
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [aiKnowledge, setAiKnowledge] = useState<string>('')
  const [timeSpan, setTimeSpan] = useState<5 | 10 | 15 | 20 | 30 | null>(null)
  const [frequency, setFrequency] = useState<Frequency | ''>('')
  const [preferredTiming, setPreferredTiming] = useState<Timing | ''>('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: profile, isLoading: profileLoading } = useAppUserProfile()

  const steps = buildSteps(profession)
  const [stepIndex, setStepIndex] = useState(0)
  const currentStepKey = steps[stepIndex]
  const totalSteps = steps.length
  const isLastStep = stepIndex === totalSteps - 1

  const completionRootRef = useRef<HTMLDivElement>(null)
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null)

  // Only redirect if user hasn't started the post-submit flow locally.
  // Once preferredTiming is answered and submitted, local phase state drives the flow.
  if (phase === 'steps' && !profileLoading && profile?.onboardingCompletedAt && !preferredTiming) {
    return <Navigate to="/dashboard" />
  }

  async function submitOnboarding() {
    const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined
    const payload: OnboardingInput = {
      profession: profession ?? undefined,
      companyWebsite: companyWebsite.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      selfReportedAiKnowledge: aiKnowledge === '' ? undefined : (Number(aiKnowledge) as 0 | 1 | 2 | 3 | 4),
      timeCommitmentSpan: timeSpan ?? undefined,
      timeCommitmentFrequency: frequency || undefined,
      preferredTiming: preferredTiming || undefined,
      timezone,
      completed: true,
    }

    await apiRequest('/api/users/onboarding', {
      method: 'POST',
      tokenProvider: () => getToken(),
      body: payload,
    })
  }

  async function handleContinue() {
    if (REQUIRED_STEPS.has(currentStepKey) && !stepComplete) {
      const messages: Record<string, string> = {
        profession: 'Please select your profession to continue.',
        timeCommitment: 'Please select both a time duration and frequency.',
        preferredTiming: 'Please select when you prefer to learn.',
      }
      setValidationError(messages[currentStepKey] ?? 'Please complete this step.')
      return
    }
    setValidationError(null)

    if (isLastStep) {
      setPhase('saving')
      setSaveError(null)
      try {
        await submitOnboarding()
        setPhase('celebration')
      } catch (err) {
        setPhase('steps')
        setSaveError(err instanceof Error ? err.message : 'Failed to save. Check the terminal: the API may need CLERK_SECRET_KEY in .env.local.')
      }
      return
    }

    setStepIndex(stepIndex + 1)
  }

  function handleSkip() {
    setStepIndex(stepIndex + 1)
  }

  const stepComplete =
    currentStepKey === 'profession'
      ? !!profession
      : currentStepKey === 'companyWebsite'
        ? true
        : currentStepKey === 'jobTitle'
          ? true
          : currentStepKey === 'aiKnowledge'
            ? true
            : currentStepKey === 'timeCommitment'
              ? timeSpan !== null && !!frequency
              : currentStepKey === 'preferredTiming'
                ? !!preferredTiming
                : false

  function handleCtaClick() {
    if (phase !== 'celebration') return
    setPhase('exiting')

    if (!completionRootRef.current) {
      setPhase('loading')
      return
    }

    const scope = scopeRef.current
    if (scope?.methods?.exit) {
      scope.methods.exit()
      window.setTimeout(() => setPhase('loading'), 450)
      return
    }

    setPhase('loading')
  }

  if (phase === 'saving') {
    return (
      <LearningScreenLayout className="items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-body text-muted-foreground">Setting up your plan...</p>
      </LearningScreenLayout>
    )
  }

  if (phase === 'celebration' || phase === 'exiting') {
    return (
      <OnboardingCompleteScreen
        scopeRef={scopeRef}
        onRootElement={(el) => {
          completionRootRef.current = el
        }}
        onCtaClick={handleCtaClick}
      />
    )
  }

  if (phase === 'loading') {
    return <PersonalisingLoader onComplete={() => navigate({ to: '/paywall/full' })} />
  }

  const stepQuestion =
    currentStepKey === 'profession'
      ? 'What describes you the best?'
      : currentStepKey === 'companyWebsite'
        ? 'Does your company have a website?'
        : currentStepKey === 'jobTitle'
          ? 'What is your job title?'
          : currentStepKey === 'aiKnowledge'
            ? 'How well do you understand AI?'
            : currentStepKey === 'timeCommitment'
              ? 'How much time can you take out to learn AI?'
              : currentStepKey === 'preferredTiming'
                ? 'When do you learn the best?'
                : ''

  return (
    <LearningScreenLayout>
      {/* Fixed header: progress bar + mascot bubble */}
      <header className="fixed top-0 right-0 left-0 z-10 flex flex-col border-b border-border bg-background">
        <ContentColumn narrow noPadding>
          <OnboardingProgressBar totalSteps={totalSteps} currentStep={stepIndex} />
        </ContentColumn>
        <ContentColumn narrow className="py-3">
          <OnboardingMascotBubble question={stepQuestion} variant="header" className="w-full" />
        </ContentColumn>
      </header>

      {/* Scrollable content — offset clears the fixed header (~130px) */}
      <div className="flex flex-1 flex-col pt-[130px]">
        <ContentColumn narrow className="flex-1 py-[var(--space-section-gap)]">
          <Stack gap="lg">
            {currentStepKey === 'profession' && (
              <RadioQuestion
                prompt=""
                options={PROFESSION_OPTIONS}
                selected={profession ? [profession] : []}
                onSelect={(id) => { setValidationError(null); setProfession(id as Profession) }}
              />
            )}

            {currentStepKey === 'companyWebsite' && (
              <Input
                placeholder="https://..."
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            )}

            {currentStepKey === 'jobTitle' && (
              <Input
                placeholder="e.g. Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            )}

            {currentStepKey === 'aiKnowledge' && (
              <RadioQuestion
                prompt=""
                options={AI_KNOWLEDGE_OPTIONS}
                selected={aiKnowledge ? [aiKnowledge] : []}
                onSelect={setAiKnowledge}
              />
            )}

            {currentStepKey === 'timeCommitment' && (
              <Stack gap="lg">
                <div className="flex flex-wrap gap-2">
                  {TIME_SPAN_OPTIONS.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      variant={timeSpan === m ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setValidationError(null); setTimeSpan(m) }}
                    >
                      {m} mins
                    </Button>
                  ))}
                </div>
                <Stack gap="md">
                  <p className="text-body text-muted-foreground">How often?</p>
                  <RadioQuestion
                    prompt=""
                    options={FREQUENCY_OPTIONS}
                    selected={frequency ? [frequency] : []}
                    onSelect={(value) => { setValidationError(null); setFrequency(value as Frequency) }}
                  />
                </Stack>
              </Stack>
            )}

            {currentStepKey === 'preferredTiming' && (
              <RadioQuestion
                prompt=""
                options={TIMING_OPTIONS}
                selected={preferredTiming ? [preferredTiming] : []}
                onSelect={(value) => { setValidationError(null); setPreferredTiming(value as Timing) }}
              />
            )}
          </Stack>
        </ContentColumn>
      </div>

      {/* CTA block — anchored to bottom of flex column */}
      <ContentColumn narrow className="flex flex-col gap-3 py-[var(--space-section-gap)]">
        {validationError && (
          <p className="text-caption text-center text-destructive">{validationError}</p>
        )}
        {saveError && (
          <p className="text-body text-center text-destructive" role="alert">
            {saveError}
          </p>
        )}
        {currentStepKey === 'companyWebsite' && (
          <Button variant="outline" size="lg" className="w-full" onClick={handleSkip}>
            Skip
          </Button>
        )}
        <StickyPrimaryCTA onClick={handleContinue} bottomSafe={false}>
          Continue
        </StickyPrimaryCTA>
      </ContentColumn>
    </LearningScreenLayout>
  )
}

function OnboardingCompleteScreen({
  scopeRef,
  onRootElement,
  onCtaClick,
}: {
  scopeRef: MutableRefObject<ReturnType<typeof createScope> | null>
  onRootElement: (el: HTMLDivElement | null) => void
  onCtaClick: () => void
}) {
  const mountedRef = useRef(false)

  const setRef = (el: HTMLDivElement | null) => {
    onRootElement(el)
    if (el && !mountedRef.current) {
      mountedRef.current = true
      scopeRef.current = createScope({ root: el }).add((self) => {
        animate('.ob-mascot', { y: [80, 0], opacity: [0, 1], duration: 700, ease: 'outExpo' })
        animate('.ob-shine', { scale: [0.8, 1.2], opacity: [0, 0.6], duration: 900, delay: 200, ease: 'outExpo' })
        self?.add('exit', () => {
          animate('.ob-mascot', { y: 120, opacity: 0, duration: 400, ease: 'inExpo' })
          animate('.ob-shine', { scale: 1.5, opacity: 0, duration: 400 })
        })
      })
    }
  }

  return (
    <div ref={setRef} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-[var(--space-screen-x)]">
      <div className="ob-shine absolute -z-10 h-[300px] w-[300px] scale-[0.8] rounded-full bg-(--onboarding-fill) opacity-0 blur-3xl" />
      <div className="ob-mascot flex justify-center">
        <CompletionMascot />
      </div>
      <p className="text-body-lg mt-[var(--space-section-gap)] text-center">Your personal plan is ready</p>
      <div className="mt-[var(--space-section-gap)] w-full max-w-xs">
        <StickyPrimaryCTA onClick={onCtaClick} bottomSafe={false}>
          Your Personal Plan is Ready
        </StickyPrimaryCTA>
      </div>
    </div>
  )
}

function CompletionMascot() {
  return (
    <MascotBlob
      className="w-80 sm:w-96"
      bodyMode="static"
      staticBaseScale={2.2}
      staticBaseOffsetX={0}
      staticBaseOffsetY={0}
      staticInnerScale={1}
      eyeVariant="excited"
      mouthVariant="grin"
      outerBlobs={DEFAULT_OUTER_BLOBS}
      innerScale={0.78}
      innerOffsetY={-8}
      faceOffsetX={0}
      faceOffsetY={-35}
      faceSpacing={1}
      faceScale={1.1}
      animationEnabled={false}
      animationSpeed={1}
      animationAmplitude={8}
      grainEnabled={false}
      grainFrequency={0.65}
      grainOctaves={4}
      grainContrast={200}
      grainBrightness={150}
      grainScale={1}
    />
  )
}

function PersonalisingLoader({ onComplete }: { onComplete: () => void }) {
  const mountedRef = useRef(false)

  const setRef = (el: HTMLDivElement | null) => {
    if (el && !mountedRef.current) {
      mountedRef.current = true

      animate(el.querySelectorAll('.pl-text'), {
        y: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 200,
        ease: 'outExpo',
      })

      const duration = 3000 + Math.random() * 2000
      window.setTimeout(() => onComplete(), duration)
    }
  }

  return (
    <div ref={setRef} className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-content-gap)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="pl-text text-body text-muted-foreground opacity-0">Personalising the app for you...</p>
    </div>
  )
}

function OnboardingFallback() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-content-gap)] px-[var(--space-screen-x)]">
      <p className="text-body text-center text-muted-foreground">
        Having trouble connecting. You can continue to the app and finish setup later.
      </p>
      <div className="w-full max-w-xs">
        <StickyPrimaryCTA bottomSafe={false} onClick={() => navigate({ to: '/dashboard' })}>
          Continue to app
        </StickyPrimaryCTA>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/onboarding')({
  component: () => (
    <OnboardingErrorBoundary fallback={<OnboardingFallback />}>
      <SignedInGuard>
        <OnboardingPage />
      </SignedInGuard>
    </OnboardingErrorBoundary>
  ),
})
