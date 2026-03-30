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
import { MascotBlob } from '@/components/mascot/MascotBlob'
import { DEFAULT_OUTER_BLOBS } from '@/components/mascot/mascot-blob-config'
import { apiRequest } from '@/lib/api/client'
import { cn } from '@/lib/utils'
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
        console.error('Failed to submit onboarding.', err)
        setPhase('steps')
        setSaveError('We could not save your plan right now. Please try again.')
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-body text-muted-foreground">Setting up your plan...</p>
      </div>
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

  const headerBubbleText =
    stepIndex === 0 && currentStepKey === 'profession'
      ? "Let's Personalize your Journey"
      : stepQuestion

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 mt-4 flex w-full flex-wrap justify-center border-b-0 bg-background">
        {/* Progress + mascot row: centered; max width 450px per layout spec */}
        <div className="box-border mx-auto flex w-full max-w-[400px] flex-col items-center gap-6 p-4">
          <div className="flex h-8 w-full max-w-[368px] items-center">
            <OnboardingProgressBar totalSteps={totalSteps} currentStep={stepIndex} />
          </div>
          <OnboardingMascotBubble
            question={headerBubbleText}
            variant="header"
            textWrap={stepIndex === 0 && currentStepKey === 'profession' ? 'nowrap' : 'wrap'}
            className="w-full justify-center"
          />
        </div>
      </header>

      <div className="box-border mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center justify-start gap-6 p-4">
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
            className="w-full max-w-[400px] focus-visible:border-[#0A0A0A] focus-visible:ring-[#0A0A0A]"
          />
        )}

        {currentStepKey === 'jobTitle' && (
          <Input
            placeholder="e.g. Product Manager"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full max-w-[400px]"
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
          <div className="flex w-full max-w-[400px] flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {TIME_SPAN_OPTIONS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    timeSpan === m &&
                      'border-[var(--quiz-option-selected-border)] bg-[var(--quiz-option-selected-bg)] text-foreground shadow-[var(--quiz-option-shadow-state)] hover:bg-[var(--quiz-option-selected-bg)] hover:text-foreground dark:border-[var(--quiz-option-selected-border)] dark:bg-[var(--quiz-option-selected-bg)] dark:hover:bg-[var(--quiz-option-selected-bg)]',
                  )}
                  onClick={() => { setValidationError(null); setTimeSpan(m) }}
                >
                  {m} mins
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-body text-muted-foreground">How often?</p>
              <RadioQuestion
                prompt=""
                options={FREQUENCY_OPTIONS}
                selected={frequency ? [frequency] : []}
                onSelect={(value) => { setValidationError(null); setFrequency(value as Frequency) }}
              />
            </div>
          </div>
        )}

        {currentStepKey === 'preferredTiming' && (
          <RadioQuestion
            prompt=""
            options={TIMING_OPTIONS}
            selected={preferredTiming ? [preferredTiming] : []}
            onSelect={(value) => { setValidationError(null); setPreferredTiming(value as Timing) }}
          />
        )}

        {validationError && (
          <p className="text-caption text-center text-destructive">{validationError}</p>
        )}
        {saveError && (
          <p className="text-body text-center text-destructive" role="alert">
            {saveError}
          </p>
        )}
        <div className="flex w-full flex-col gap-2">
          {currentStepKey === 'companyWebsite' && (
            <Button variant="outline" size="lg" className="w-full" onClick={handleSkip}>
              Skip
            </Button>
          )}
          <Button
            size="lg"
            className="h-[46px] w-full max-w-[368px] self-center rounded-xl bg-foreground text-background hover:bg-foreground/90"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
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
    <div ref={setRef} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="ob-shine absolute -z-10 h-[300px] w-[300px] scale-[0.8] rounded-full bg-(--onboarding-fill) opacity-0 blur-3xl" />
      <div className="ob-mascot flex justify-center">
        <CompletionMascot />
      </div>
      <p className="mt-6 text-center text-body-lg">Your personal plan is ready</p>
      <div className="mt-6 w-full max-w-xs">
        <Button
          size="lg"
          className="h-[46px] w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          onClick={onCtaClick}
        >
          Your Personal Plan is Ready
        </Button>
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
    <div ref={setRef} className="flex min-h-dvh flex-col items-center justify-center gap-5">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="pl-text text-body text-muted-foreground opacity-0">Personalising the app for you...</p>
    </div>
  )
}

function OnboardingFallback() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
      <p className="text-body text-center text-muted-foreground">
        Having trouble connecting. You can continue to the app and finish setup later.
      </p>
      <div className="w-full max-w-xs">
        <Button
          size="lg"
          className="h-[46px] w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          onClick={() => navigate({ to: '/dashboard' })}
        >
          Continue to app
        </Button>
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
