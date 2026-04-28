import { useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { TRIAGE_STEPS } from '../../utils/triageData'

export function TriageGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const step = TRIAGE_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TRIAGE_STEPS.length - 1

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-warning/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          <span className="text-xs font-semibold text-warning">Triage Guide</span>
          <span className="text-[10px] text-warning/60 hidden sm:block">
            Step {currentStep + 1} of {TRIAGE_STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-warning/60 truncate max-w-[120px]">{step.title}</span>
          {collapsed
            ? <ChevronDown className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            : <ChevronUp className="w-3.5 h-3.5 text-warning flex-shrink-0" />}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2.5">
          <div>
            <p className="text-[10px] text-warning/50 uppercase tracking-wider font-medium">
              {step.section}
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{step.title}</p>
          </div>

          <ul className="space-y-1.5">
            {step.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-warning/50 font-mono mt-0.5 flex-shrink-0 w-4">
                  {i + 1}.
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1 border-t border-warning/20">
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={isFirst}
              className="flex items-center gap-1 text-[11px] text-warning/70 hover:text-warning disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>

            <div className="flex items-center gap-1">
              {TRIAGE_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`rounded-full transition-all ${
                    i === currentStep
                      ? 'w-4 h-1.5 bg-warning'
                      : 'w-1.5 h-1.5 bg-warning/30 hover:bg-warning/60'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(s => Math.min(TRIAGE_STEPS.length - 1, s + 1))}
              disabled={isLast}
              className="flex items-center gap-1 text-[11px] text-warning/70 hover:text-warning disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
