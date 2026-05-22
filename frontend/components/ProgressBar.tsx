interface ProgressBarProps {
  funded: bigint
  target: bigint
  className?: string
}

export function ProgressBar({ funded, target, className = '' }: ProgressBarProps) {
  const pct = target === 0n ? 0 : Math.min(100, Number((funded * 100n) / target))

  return (
    <div className={`w-full bg-gray-800 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-green-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
