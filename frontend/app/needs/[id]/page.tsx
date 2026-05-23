'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { type Abi } from 'viem'
import { useNeed } from '@/hooks/useNeeds'
import { useIPFSData } from '@/hooks/useIPFS'
import { ProgressBar } from '@/components/ProgressBar'
import { DonateModal } from '@/components/DonateModal'
import { formatUsdc, NEED_STATUS, ADDRESSES, ABIS, ipfsUrl } from '@/lib/contracts'
import { ExternalLink, ArrowLeft, Loader2, Store, Heart, ShieldCheck, Wallet } from 'lucide-react'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

function ConnectPrompt() {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => (
        <button
          onClick={openConnectModal}
          disabled={!mounted}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl py-3 font-semibold transition-colors"
        >
          <Wallet size={16} />
          Connect to Donate
        </button>
      )}
    </ConnectButton.Custom>
  )
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🛒', medicine: '💊', clothing: '👕',
  hygiene: '🧼', utilities: '💡', other: '📦',
}

const STATUS_COLORS: Record<string, string> = {
  Open:      'bg-green-950 text-green-400 border-green-800',
  Funded:    'bg-blue-950 text-blue-400 border-blue-800',
  Fulfilled: 'bg-gray-800 text-gray-400 border-gray-700',
  Cancelled: 'bg-red-950 text-red-400 border-red-800',
}

export default function NeedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const needId = BigInt(id ?? '0')
  const { need, balance, isLoading, refetch } = useNeed(needId)
  const { address } = useAccount()
  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch need metadata from IPFS
  const { data: needMeta } = useIPFSData<{
    title?: string; description?: string; category?: string
  }>(need?.descriptionHash ?? '')

  // Read vendor info + recipient profileHash from contracts (enabled only once `need` is loaded)
  const { data: chainData } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.vendorRegistry,
        abi: ABIS.vendorRegistry as Abi,
        functionName: 'vendors',
        args: [need?.vendor ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        address: ADDRESSES.recipientRegistry,
        abi: ABIS.recipientRegistry as Abi,
        functionName: 'recipients',
        args: [need?.recipientId ?? 0n],
      },
    ],
    query: { enabled: !!need },
  })

  const vendorName = (chainData?.[0]?.result as [string, string, boolean, bigint] | undefined)?.[0]
  const recipientProfileHash = (chainData?.[1]?.result as [string, boolean, bigint, bigint] | undefined)?.[0]

  // Fetch recipient profile from IPFS once we have the profileHash
  const { data: recipientMeta } = useIPFSData<{
    firstName?: string; story?: string; location?: string
  }>(recipientProfileHash ?? '')

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
  const remaining = need.targetAmount > balance ? need.targetAmount - balance : 0n

  const title       = needMeta?.title       ?? `Need #${id}`
  const description = needMeta?.description ?? ''
  const category    = needMeta?.category    ?? ''
  const emoji       = CATEGORY_EMOJI[category] ?? '📦'
  const firstName   = recipientMeta?.firstName ?? ''
  const story       = recipientMeta?.story     ?? ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors">
        <ArrowLeft size={14} />
        Back to all needs
      </Link>

      {/* Title + status */}
      <div className="space-y-2">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-3xl mt-0.5 shrink-0">{emoji}</span>
          <div className="flex-1 min-w-0 space-y-1.5">
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span className="text-xs text-gray-500 capitalize bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                  {category}
                </span>
              )}
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Need description */}
      {description && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Recipient story */}
      {(firstName || story) && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Heart size={14} className="text-pink-400 shrink-0" />
            <span>About {firstName || 'the recipient'}</span>
          </div>
          {story && (
            <p className="text-sm text-gray-400 leading-relaxed">{story}</p>
          )}
          {recipientMeta?.location && (
            <p className="text-xs text-gray-500">📍 {recipientMeta.location}</p>
          )}
        </div>
      )}

      {/* Vendor */}
      {vendorName && (
        <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
          <Store size={14} className="text-green-400 shrink-0" />
          <span>
            Goods purchased from{' '}
            <span className="text-gray-200 font-medium">{vendorName}</span>
          </span>
        </div>
      )}

      {/* Funding progress + donate */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-base">Funding Progress</h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">${formatUsdc(balance)} raised</span>
          <span className="font-semibold text-green-400">${formatUsdc(need.targetAmount)} goal</span>
        </div>
        <ProgressBar funded={balance} target={need.targetAmount} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{pct}% funded</span>
          {remaining > 0n && <span>${formatUsdc(remaining)} still needed</span>}
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
            <div className="space-y-2">
              <ConnectPrompt />
              <p className="text-center text-xs text-gray-500">
                No crypto account? Use <span className="text-blue-400">Coinbase Wallet</span> to sign in with Face ID or your fingerprint — no seed phrase needed.
              </p>
            </div>
          )
        )}

        {status === 'Fulfilled' && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 rounded-xl p-3">
            <span>✅</span>
            <span>
              This need has been fulfilled!{firstName ? ` The goods were delivered to ${firstName}.` : ' The goods were delivered.'}
            </span>
          </div>
        )}

        {status === 'Funded' && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-blue-950/50 rounded-xl p-3">
            <span>🎉</span>
            <span>Fully funded! The purchase is being arranged with {vendorName ?? 'the vendor'}.</span>
          </div>
        )}
      </div>

      {/* Blockchain transparency (collapsed by default) */}
      <div className="border border-dashed border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-400" />
            <span>Blockchain Transparency Details</span>
          </div>
          <span className="text-xs text-gray-600">{showDetails ? '▲ hide' : '▼ show'}</span>
        </button>

        {showDetails && (
          <div className="px-5 pb-5 space-y-3 text-sm border-t border-dashed border-gray-800 pt-4">
            <p className="text-xs text-gray-500">
              Every donation, status change, and purchase receipt for this need is permanently
              recorded on the Base blockchain — verifiable by anyone, at any time. Funds can only
              be released to the assigned vendor.
            </p>
            <Row label="Need ID" value={`#${id}`} />
            <Row label="Recipient ID" value={`#${need.recipientId.toString()}`} />
            <Row label="Created" value={new Date(Number(need.createdAt) * 1000).toLocaleDateString()} />
            {need.fulfilledAt > 0n && (
              <Row label="Fulfilled" value={new Date(Number(need.fulfilledAt) * 1000).toLocaleDateString()} />
            )}
            <Row label="Vendor wallet" value={
              <a
                href={`https://sepolia.basescan.org/address/${need.vendor}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-green-400 hover:underline flex items-center gap-1"
              >
                {need.vendor.slice(0, 10)}…{need.vendor.slice(-8)} <ExternalLink size={10} />
              </a>
            } />
            <Row label="Metadata (IPFS)" value={
              <a
                href={ipfsUrl(need.descriptionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline flex items-center gap-1"
              >
                View raw data <ExternalLink size={10} />
              </a>
            } />
            {need.receiptHash && (
              <Row label="Purchase receipt" value={
                <a
                  href={ipfsUrl(need.receiptHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline flex items-center gap-1"
                >
                  View receipt <ExternalLink size={10} />
                </a>
              } />
            )}
          </div>
        )}
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
      <span className="text-gray-500 shrink-0 w-36">{label}</span>
      <span className="text-gray-200 break-all">{value}</span>
    </div>
  )
}
