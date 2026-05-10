interface Props {
  currentStep: 1 | 2 | 3
  d: boolean
}

const steps = [
  { num: 1, label: 'CV & İlan' },
  { num: 2, label: 'Mülakat Türü' },
  { num: 3, label: 'Mülakat' },
]

export function StepIndicator({ currentStep, d }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '20px' }}>
      {steps.map((step, i) => {
        const isCompleted = step.num < currentStep
        const isActive = step.num === currentStep

        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base"
                style={{
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  background: isCompleted
                    ? '#10b981'
                    : isActive
                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                    : d
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.07)',
                  color: isCompleted || isActive ? '#fff' : d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)',
                  boxShadow: isActive ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                }}
              >
                {isCompleted ? '✓' : step.num}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? d ? '#93c5fd' : '#3b82f6'
                    : isCompleted
                    ? '#10b981'
                    : d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                style={{
                  width: '48px',
                  height: '2px',
                  marginBottom: '14px',
                  marginLeft: '6px',
                  marginRight: '6px',
                  background: isCompleted
                    ? '#10b981'
                    : d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
