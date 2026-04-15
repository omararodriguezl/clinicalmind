import { useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { INTAKE_STEPS } from '../../utils/intakeData'

export function IntakeGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const step = INTAKE_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === INTAKE_STEPS.length - 1

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-semibold text-primary">Intake Guide</span>
          <span className="text-[10px] text-primary/60 hidden sm:block">
            Step {currentStep + 1} of {INTAKE_STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-primary/60 truncate max-w-[120px]">{step.title}</span>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2.5">
          {/* Section + title */}
          <div>
            <p className="text-[10px] text-primary/50 uppercase tracking-wider font-medium">
              {step.section}
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{step.title}</p>
          </div>

          {/* Instruction callout */}
          {step.instruction && (
            <div className="flex items-start gap-1.5 p-2 rounded-md bg-primary/10 border border-primary/20">
              <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-primary/80 leading-relaxed">{step.instruction}</p>
            </div>
          )}

          {/* Questions */}
          <ul className="space-y-1.5">
            {step.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-primary/50 font-mono mt-0.5 flex-shrink-0 w-4">
                  {i + 1}.
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1 border-t border-primary/20">
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={isFirst}
              className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>

            {/* Step dots — show up to 7 dots, centered on current */}
            <div className="flex items-center gap-1">
              {INTAKE_STEPS.map((_, i) => {
                const delta = Math.abs(i - currentStep)
                if (delta > 3) return null
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`rounded-full transition-all ${
                      i === currentStep
                        ? 'w-4 h-1.5 bg-primary'
                        : 'w-1.5 h-1.5 bg-primary/30 hover:bg-primary/60'
                    }`}
                  />
                )
              })}
            </div>

            <button
              onClick={() => setCurrentStep(s => Math.min(INTAKE_STEPS.length - 1, s + 1))}
              disabled={isLast}
              className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
