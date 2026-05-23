'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { type Abi } from 'viem'
import { ADDRESSES, ABIS } from '@/lib/contracts'
import { X, Wallet, Coins, Heart, ShieldCheck, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Wallet,
    title: 'Connect your wallet',
    detail: 'Click "Connect to Donate" in the top right. Choose Coinbase Wallet — you can sign in with Face ID or a fingerprint. No account or crypto experience needed.',
    completedLabel: 'Wallet connected ✓',
  },
  {
    icon: Coins,
    title: 'Get your free demo USDC',
    detail: 'USDC is a digital dollar used on this platform. A blue banner will appear below — click "Get $50 Demo USDC" to load your wallet with free test tokens in one click.',
    completedLabel: 'Demo USDC received ✓',
  },
  {
    icon: Heart,
    title: 'Donate to a real need',
    detail: 'Click on Maria\'s need below, read her story, then click "Donate USDC". Pick an amount — even $1 works. You\'ll confirm two quick steps: approve and donate.',
    completedLabel: 'Ready to donate ✓',
  },
  {
    icon: ShieldCheck,
    title: 'See your proof on the blockchain',
    detail: 'After donating, scroll back to the homepage. Your transaction appears in the "Live donation record" section with a "Verify" link. Click it — that\'s your permanent public proof that the money is locked and on its way to the store.',
    completedLabel: 'Proof is on-chain forever ✓',
  },
]

export function DemoTutorial() {
  const { address, isConnected } = useAccount()
  const [dismissed, setDismissed]   = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [mounted, setMounted]       = useState(false)

  // Check USDC balance
  const { data: balanceData } = useReadContracts({
    contracts: [{
      address: ADDRESSES.usdc,
      abi: ABIS.erc20 as Abi,
      functionName: 'balanceOf',
      args: [address ?? '0x0000000000000000000000000000000000000000'],
    }],
    query: { enabled: isConnected && !!address },
  })
  const usdcBalance = (balanceData?.[0]?.result as bigint) ?? 0n
  const hasUsdc = usdcBalance >= 1_000_000n // at least $1

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('gc-tutorial-dismissed')
    if (saved === 'true') setDismissed(true)
    const savedCollapsed = localStorage.getItem('gc-tutorial-collapsed')
    if (savedCollapsed === 'true') setCollapsed(true)
  }, [])

  function dismiss() {
    setDismissed(true)
    localStorage.setItem('gc-tutorial-dismissed', 'true')
  }

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('gc-tutorial-collapsed', String(next))
  }

  // Derive current step from app state
  const currentStep =
    !isConnected ? 0 :
    !hasUsdc     ? 1 :
                   2   // steps 3 & 4 happen on the need detail page

  if (!mounted || dismissed) return null

  return (
    <div className="bg-gray-900 border border-green-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < currentStep
                    ? 'bg-green-400 w-6'
                    : i === currentStep
                    ? 'bg-green-500 w-6 animate-pulse'
                    : 'bg-gray-700 w-4'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-200">
            {currentStep >= STEPS.length
              ? '🎉 Demo complete!'
              : `Step ${currentStep + 1} of ${STEPS.length} — ${STEPS[currentStep].title}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{collapsed ? 'show guide' : 'hide'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            className="text-gray-600 hover:text-gray-400 transition-colors p-0.5"
            title="Dismiss tutorial"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Steps — collapsible */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const done    = i < currentStep
              const active  = i === currentStep
              const locked  = i > currentStep

              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 space-y-2 border transition-all ${
                    done   ? 'border-green-900 bg-green-950/30' :
                    active ? 'border-green-600 bg-green-950/50' :
                             'border-gray-800 bg-gray-800/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done   ? 'bg-green-600 text-white' :
                      active ? 'bg-green-500 text-white' :
                               'bg-gray-700 text-gray-500'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <Icon size={14} className={done ? 'text-green-400' : active ? 'text-green-400' : 'text-gray-600'} />
                    <span className={`text-xs font-semibold ${active ? 'text-green-300' : done ? 'text-green-400' : 'text-gray-500'}`}>
                      {done ? step.completedLabel : step.title}
                    </span>
                  </div>
                  {active && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {step.detail}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {currentStep === 2 && (
            <div className="flex items-center gap-2 text-sm text-green-400 pt-1">
              <ChevronRight size={14} />
              <span>You have USDC — scroll down and click on a need to donate!</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
