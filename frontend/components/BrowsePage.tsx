'use client'

import { useNeedCount, useAllNeeds, useDonationCount, useDonationLog } from '@/hooks/useNeeds'
import { NeedCard } from './NeedCard'
import { formatUsdc, NEED_STATUS, ADDRESSES } from '@/lib/contracts'
import { Loader2, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { DemoFaucet } from './DemoFaucet'
import { DemoTutorial } from './DemoTutorial'

export function BrowsePage() {
  const { count, isLoading: countLoading } = useNeedCount()
  const { needs, isLoading: needsLoading }  = useAllNeeds(count)
  const { count: donationCount }            = useDonationCount()
  const { donations }                       = useDonationLog(donationCount)

  const openNeeds      = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Open')
  const fulfilledNeeds = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Fulfilled')
  const totalRaised    = needs.reduce((sum, n) => sum + (n.balance ?? 0n), 0n)

  const isLoading = countLoading || needsLoading

  // Show up to 5 most recent donations
  const recentDonations = [...donations].reverse().slice(0, 5)

  return (
    <div className="space-y-14">

      {/* Step-by-step demo guide */}
      <DemoTutorial />

      {/* Hero */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Give with{' '}
          <span className="text-green-400">complete proof.</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          Like GoFundMe — except you never have to wonder where your money went.
          Every donation is a permanent public record, and funds can
          only be spent at the assigned store. No exceptions.
        </p>
      </section>

      {/* Demo faucet — only shows when connected with no USDC */}
      <DemoFaucet />

      {/* The big comparison */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* GivingChain side — first */}
        <div className="bg-gray-900 border border-green-900 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-semibold text-green-500 uppercase tracking-wider">GivingChain</div>
          <ul className="space-y-3 text-sm text-gray-300">
            {[
              'Your donation is recorded on the blockchain — a public ledger anyone can read.',
              'Funds are locked in a smart contract, not a bank account.',
              'The contract only releases money to the pre-assigned store. No one can change that.',
              'After purchase, the receipt is stored permanently and publicly.',
              'Every step is verifiable by anyone in the world, forever.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Traditional platforms side */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Traditional platforms</div>
          <ul className="space-y-3 text-sm text-gray-400">
            {[
              'You donate and receive a thank-you email.',
              "The money enters the organization's bank account.",
              'You have no way to verify it reached the right person.',
              'You trust the receipt is real — you just never see it.',
              "Funds could be redirected. You'd never know.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What "on the blockchain" actually means */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-green-400 shrink-0" size={20} />
          <h2 className="text-lg font-semibold">What does "on the blockchain" actually mean?</h2>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          Think of the blockchain like a shared spreadsheet that thousands of computers around the world
          keep a copy of. Once something is written to it, it cannot be changed or deleted — by anyone,
          including us. Every donation made on GivingChain is written to that spreadsheet the moment it
          happens. You can look it up yourself right now.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            {
              label: 'The donation contract',
              desc: 'The code that holds your money. Open source, readable by anyone.',
              href: `https://sepolia.basescan.org/address/${ADDRESSES.donationEscrow}`,
              cta: 'View on Basescan →',
            },
            {
              label: 'Every transaction',
              desc: 'A live feed of every donation ever made. Public, permanent, uneditable.',
              href: `https://sepolia.basescan.org/address/${ADDRESSES.donationEscrow}#events`,
              cta: 'See all transactions →',
            },
            {
              label: 'This platform\'s transparency page',
              desc: 'A human-readable view of all donations and fulfilled needs with receipts.',
              href: '/transparency',
              cta: 'View transparency log →',
              internal: true,
            },
          ].map(({ label, desc, href, cta, internal }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="font-medium text-gray-200">{label}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
              {internal
                ? <Link href={href} className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1">{cta}</Link>
                : <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1">
                    {cta} <ExternalLink size={10} />
                  </a>
              }
            </div>
          ))}
        </div>
      </section>

      {/* Live donation feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Live donation record
          </h2>
          <Link href="/transparency" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">
            Full log <ArrowRight size={13} />
          </Link>
        </div>

        {recentDonations.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-8 text-center space-y-2">
            <p className="text-gray-400 text-sm">No donations yet — be the first.</p>
            <p className="text-gray-600 text-xs">
              When someone donates, their transaction will appear here as a permanent public record
              that anyone can verify on the blockchain.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="text-xs text-gray-600 px-4 py-2 border-b border-gray-800 flex gap-4">
              <span className="w-28 shrink-0">Donor</span>
              <span className="w-20 shrink-0">Amount</span>
              <span className="flex-1">Need</span>
              <span className="shrink-0">Proof</span>
            </div>
            {recentDonations.map((d, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/50 last:border-0 text-sm">
                <span className="w-28 shrink-0 font-mono text-gray-400 text-xs truncate">
                  {d!.donor.slice(0, 6)}…{d!.donor.slice(-4)}
                </span>
                <span className="w-20 shrink-0 text-green-400 font-medium">
                  ${formatUsdc(d!.amount)}
                </span>
                <span className="flex-1 text-gray-400 text-xs">
                  Need #{d!.needId.toString()}
                </span>
                <a
                  href={`https://sepolia.basescan.org/address/${ADDRESSES.donationEscrow}#events`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"
                >
                  Verify <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 text-center">
          These transactions are written to the Base blockchain and cannot be altered or deleted by anyone.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Total raised',    value: `$${formatUsdc(totalRaised)}` },
          { label: 'Needs fulfilled', value: fulfilledNeeds.length.toString() },
          { label: 'Donations made',  value: donationCount.toString() },
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
