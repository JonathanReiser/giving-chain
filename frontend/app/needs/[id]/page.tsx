'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useNeed } from '@/hooks/useNeeds'
import { ProgressBar } from '@/components/ProgressBar'
import { DonateModal } from '@/components/DonateModal'
import { formatUsdc, NEED_STATUS, ipfsUrl } from '@/lib/contracts'
import { ExternalLink, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NeedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const needId = BigInt(id ?? '0')
  const { need, balance, isLoading, refetch } = useNeed(needId)
  const { address } = useAccount()
  const [showModal, setShowModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 text-gray-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  if (!need) {
    return (
      <div className="text-center py-24 text-gray-500">
        Need #{id} not found.
        <br />
        <Link href="/" className="text-green-400 hover:underline mt-2 inline-block">Back to browse</Link>
      </div>
    )
  }

  const status = NEED_STATUS[need.status] ?? 'Open'
  const pct = need.targetAmount === 0n ? 0 : Number((balance * 100n) / need.targetAmount)
  const canDonate = status === 'Open' && !!address

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors">
        <ArrowLeft size={14} />
        Back to all needs
      </Link>

      {/* Status badge + title */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Need #{id}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
          status === 'Open'      ? 'bg-green-950 text-green-400 border-green-800' :
          status === 'Funded'    ? 'bg-blue-950 text-blue-400 border-blue-800' :
          status === 'Fulfilled' ? 'bg-gray-800 text-gray-400 border-gray-700' :
                                   'bg-red-950 text-red-400 border-red-800'
        }`}>
          {status}
        </span>
      </div>

      {/* Funding progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Raised so far</span>
          <span className="font-semibold text-green-400">${formatUsdc(balance)} / ${formatUsdc(need.targetAmount)}</span>
        </div>
        <ProgressBar funded={balance} target={need.targetAmount} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{pct}% funded</span>
          <span>${formatUsdc(need.targetAmount - balance)} remaining</span>
        </div>

        {status === 'Open' && (
          address ? (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-3 font-semibold transition-colors"
            >
              Donate USDC
            </button>
          ) : (
            <p className="text-center text-sm text-gray-400 py-2">Connect your wallet to donate.</p>
          )
        )}
      </div>

      {/* On-chain metadata */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 text-sm">
        <h2 className="font-semibold text-base mb-2">On-Chain Details</h2>
        <Row label="Recipient ID" value={`#${need.recipientId.toString()}`} />
        <Row label="Vendor address" value={
          <a href={`https://basescan.org/address/${need.vendor}`} target="_blank" rel="noopener noreferrer"
             className="font-mono text-green-400 hover:underline flex items-center gap-1">
            {need.vendor} <ExternalLink size={11} />
          </a>
        } />
        <Row label="Description (IPFS)" value={
          <a href={ipfsUrl(need.descriptionHash)} target="_blank" rel="noopener noreferrer"
             className="font-mono text-green-400 hover:underline flex items-center gap-1 break-all">
            {need.descriptionHash} <ExternalLink size={11} />
          </a>
        } />
        <Row label="Created" value={new Date(Number(need.createdAt) * 1000).toLocaleDateString()} />
        {need.fulfilledAt > 0n && (
          <Row label="Fulfilled" value={new Date(Number(need.fulfilledAt) * 1000).toLocaleDateString()} />
        )}
        {need.receiptHash && (
          <Row label="Purchase receipt (IPFS)" value={
            <a href={ipfsUrl(need.receiptHash)} target="_blank" rel="noopener noreferrer"
               className="font-mono text-green-400 hover:underline flex items-center gap-1 break-all">
              {need.receiptHash} <ExternalLink size={11} />
            </a>
          } />
        )}
      </div>

      {/* Transparency note */}
      <div className="text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl p-4">
        All amounts, status changes, and the purchase receipt for this need are permanently recorded on the Base
        blockchain and verifiable by anyone. No funds can be redirected from the assigned vendor.
      </div>

      {showModal && canDonate && (
        <DonateModal
          needId={needId}
          targetAmount={need.targetAmount}
          funded={balance}
          onClose={() => setShowModal(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-gray-200 break-all">{value}</span>
    </div>
  )
}
