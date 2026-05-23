'use client'

import { useNeedCount, useAllNeeds, useDonationCount } from '@/hooks/useNeeds'
import { NeedCard } from './NeedCard'
import { formatUsdc, NEED_STATUS } from '@/lib/contracts'
import { Loader2, Lock, Search, Receipt } from 'lucide-react'

export function BrowsePage() {
  const { count, isLoading: countLoading } = useNeedCount()
  const { needs, isLoading: needsLoading } = useAllNeeds(count)
  const { count: donationCount } = useDonationCount()

  const openNeeds     = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Open')
  const fulfilledNeeds = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Fulfilled')
  const totalRaised   = needs.reduce((sum, n) => sum + (n.balance ?? 0n), 0n)

  const isLoading = countLoading || needsLoading

  return (
    <div className="space-y-14">

      {/* Hero */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Help real people.{' '}
          <span className="text-green-400">See exactly where it goes.</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          GivingChain is like a donation platform — but every dollar is publicly tracked
          from the moment you give to the moment the goods are purchased. No middlemen,
          no mystery, no trust required.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-center text-xl font-semibold text-gray-300">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              icon: Search,
              title: 'Browse a real need',
              desc: 'Each need is posted by a verified person — a family that needs groceries, medicine, or household essentials. You can read their story before you give.',
            },
            {
              step: '2',
              icon: Lock,
              title: "Donate and it's locked in",
              desc: 'Your donation is held securely until the full amount is raised. It can only be released to the assigned store — nobody can redirect it or pocket it.',
            },
            {
              step: '3',
              icon: Receipt,
              title: 'See the purchase happen',
              desc: 'Once the goods are bought, a receipt is posted. You can verify that your money bought exactly what it was supposed to — anytime, forever.',
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm">
                {step}
              </div>
              <div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-sm text-gray-400 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why this is different */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold mb-3">Why this is different from GoFundMe or a traditional charity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm text-gray-400">
          {[
            ['With most charities', "You donate and hope it's used well. You get a thank-you email."],
            ['With GivingChain', 'You donate and can verify exactly what was purchased, when, and from where.'],
            ['With most platforms', "Funds pass through the organization's bank account before reaching anyone."],
            ['With GivingChain', 'Funds are locked in a smart contract and go directly to the vendor — the organization never touches them.'],
          ].map(([label, text]) => (
            <div key={label} className="flex gap-2">
              <span className={`shrink-0 font-medium ${label.startsWith('With GivingChain') ? 'text-green-400' : 'text-gray-500'}`}>
                {label.startsWith('With GivingChain') ? '✓' : '✗'}
              </span>
              <span><span className="font-medium text-gray-300">{label}:</span> {text}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          For the technically curious: donations are held in a smart contract on the Base blockchain. Funds can only be released to a pre-approved vendor address once the full amount is raised. Every transaction is publicly verifiable on-chain.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Total raised',       value: `$${formatUsdc(totalRaised)}` },
          { label: 'Needs fulfilled',    value: fulfilledNeeds.length.toString() },
          { label: 'Donations made',     value: donationCount.toString() },
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
          <h2 className="text-xl font-semibold mb-4 text-gray-400">Fulfilled Needs ✓</h2>
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
