'use client'

import { useRouter } from 'next/navigation'
import { ProgressBar } from './ProgressBar'
import { formatUsdc, NEED_STATUS, ipfsUrl } from '@/lib/contracts'
import { ExternalLink } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Open:      'bg-green-950 text-green-400 border-green-800',
  Funded:    'bg-blue-950 text-blue-400 border-blue-800',
  Fulfilled: 'bg-gray-800 text-gray-400 border-gray-700',
  Cancelled: 'bg-red-950 text-red-400 border-red-800',
}

interface NeedCardProps {
  id: bigint
  need: {
    recipientId: bigint
    vendor: `0x${string}`
    descriptionHash: string
    targetAmount: bigint
    status: number
    receiptHash: string
    createdAt: bigint
  }
  balance: bigint
}

export function NeedCard({ id, need, balance }: NeedCardProps) {
  const router = useRouter()
  const status = NEED_STATUS[need.status] ?? 'Open'
  const pct = need.targetAmount === 0n ? 0 : Number((balance * 100n) / need.targetAmount)

  return (
    <div
      onClick={() => router.push(`/needs/${id}`)}
      className="cursor-pointer"
    >
      <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-green-950/30 h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Recipient #{need.recipientId.toString()}</div>
            <div className="text-xs font-mono text-gray-500 truncate max-w-[160px]">
              CID: {need.descriptionHash.slice(0, 16)}…
            </div>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
            {status}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">${formatUsdc(balance)} raised</span>
            <span className="text-gray-300 font-medium">${formatUsdc(need.targetAmount)} goal</span>
          </div>
          <ProgressBar funded={balance} target={need.targetAmount} />
          <div className="text-xs text-gray-500">{pct}% funded</div>
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
          <span>Vendor: {need.vendor.slice(0, 6)}…{need.vendor.slice(-4)}</span>
          {need.receiptHash && (
            <a
              href={ipfsUrl(need.receiptHash)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-green-400 hover:text-green-300"
            >
              Receipt <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
