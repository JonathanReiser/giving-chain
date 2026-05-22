'use client'

import { useDonationCount, useDonationLog, useNeedCount, useAllNeeds } from '@/hooks/useNeeds'
import { formatUsdc, NEED_STATUS, ipfsUrl } from '@/lib/contracts'
import { ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TransparencyPage() {
  const { count: donationCount, isLoading: donCountLoading } = useDonationCount()
  const { donations, isLoading: donLoading } = useDonationLog(donationCount)
  const { count: needCount, isLoading: needCountLoading } = useNeedCount()
  const { needs, isLoading: needsLoading } = useAllNeeds(needCount)

  const isLoading = donCountLoading || donLoading || needCountLoading || needsLoading

  const fulfilledNeeds = needs.filter((n) => n.need && NEED_STATUS[n.need.status] === 'Fulfilled')
  const totalRaised = needs.reduce((sum, n) => sum + (n.balance ?? 0n), 0n)
  const totalDonations = donationCount

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Transparency Dashboard</h1>
        <p className="text-gray-400">
          Every transaction recorded on the Base blockchain. Fully public, permanently auditable.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {[
          { label: 'Total raised',      value: `$${formatUsdc(totalRaised)}` },
          { label: 'Donations',         value: totalDonations.toString() },
          { label: 'Needs created',     value: needCount.toString() },
          { label: 'Needs fulfilled',   value: fulfilledNeeds.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl py-5">
            <div className="text-2xl font-bold text-green-400">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          {/* Fulfilled needs with receipts */}
          {fulfilledNeeds.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Fulfilled Needs — Proof of Purchase</h2>
              <div className="space-y-3">
                {fulfilledNeeds.map(({ id, need }) => (
                  need ? (
                    <div key={id.toString()} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex-1 min-w-0">
                        <Link href={`/needs/${id}`} className="font-semibold hover:text-green-400 transition-colors">
                          Need #{id.toString()}
                        </Link>
                        <div className="text-gray-400 text-xs mt-0.5">
                          Recipient #{need.recipientId.toString()} · ${formatUsdc(need.targetAmount)} USDC
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Fulfilled {new Date(Number(need.fulfilledAt) * 1000).toLocaleDateString()}
                      </div>
                      {need.receiptHash && (
                        <a
                          href={ipfsUrl(need.receiptHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs font-medium"
                        >
                          View receipt <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          )}

          {/* Donation log */}
          <section>
            <h2 className="text-xl font-semibold mb-4">All Donations</h2>
            {donations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                No donations yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Donor</th>
                      <th className="text-left px-4 py-3">Need</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="text-right px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[...donations].reverse().map((d, i) => (
                      d ? (
                        <tr key={i} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-300 text-xs">
                            {d.donor.slice(0, 8)}…{d.donor.slice(-6)}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/needs/${d.needId}`} className="text-green-400 hover:underline">
                              #{d.needId.toString()}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">${formatUsdc(d.amount)}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-xs">
                            {new Date(Number(d.timestamp) * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
