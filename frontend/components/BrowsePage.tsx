'use client'

import { useNeedCount, useAllNeeds, useDonationCount } from '@/hooks/useNeeds'
import { NeedCard } from './NeedCard'
import { formatUsdc, NEED_STATUS } from '@/lib/contracts'
import { Loader2, ShieldCheck, Zap, Eye } from 'lucide-react'

export function BrowsePage() {
  const { count, isLoading: countLoading } = useNeedCount()
  const { needs, isLoading: needsLoading } = useAllNeeds(count)
  const { count: donationCount } = useDonationCount()

  const openNeeds = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Open')
  const fulfilledNeeds = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Fulfilled')
  const totalRaised = needs.reduce((sum, n) => sum + (n.balance ?? 0n), 0n)

  const isLoading = countLoading || needsLoading

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Help real people.{' '}
          <span className="text-green-400">Every dollar on-chain.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Browse verified needs, donate USDC, and watch every transaction flow transparently from your
          wallet to the vendor — with permanent proof on the blockchain.
        </p>
      </section>

      {/* Trust pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, title: 'Funds in escrow', desc: 'Your USDC is locked in a smart contract until goods are purchased.' },
          { icon: Eye,         title: 'Fully auditable',  desc: 'Every donation is a public on-chain event anyone can verify.' },
          { icon: Zap,         title: 'Direct to vendor', desc: 'Payment goes straight to the vendor — never through the nonprofit.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4">
            <Icon className="text-green-400 shrink-0 mt-0.5" size={22} />
            <div>
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-sm text-gray-400">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Total raised',     value: `$${formatUsdc(totalRaised)}` },
          { label: 'Needs fulfilled',  value: fulfilledNeeds.length.toString() },
          { label: 'On-chain donations', value: donationCount.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl py-5">
            <div className="text-2xl font-bold text-green-400">{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Need grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Open Needs</h2>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gray-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : openNeeds.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
            No open needs yet. Check back soon — or{' '}
            <a href="/admin" className="text-green-400 hover:underline">add one as an admin</a>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openNeeds.map(({ id, need, balance }) =>
              need ? <NeedCard key={id.toString()} id={id} need={need} balance={balance} /> : null
            )}
          </div>
        )}
      </section>

      {/* Fulfilled */}
      {fulfilledNeeds.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-400">Fulfilled Needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fulfilledNeeds.map(({ id, need, balance }) =>
              need ? <NeedCard key={id.toString()} id={id} need={need} balance={balance} /> : null
            )}
          </div>
        </section>
      )}
    </div>
  )
}
