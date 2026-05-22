'use client'

import { type Abi } from 'viem'
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { ADDRESSES, ABIS, parseUsdc } from '@/lib/contracts'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminPage() {
  const { address, isConnected } = useAccount()

  const { data: ownerData } = useReadContracts({
    contracts: [{
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'owner',
    }],
    query: { enabled: isConnected },
  })
  const owner = ownerData?.[0]?.result as `0x${string}` | undefined
  const isOwner = !!address && !!owner && address.toLowerCase() === owner.toLowerCase()

  if (!isConnected) {
    return (
      <div className="text-center py-24 text-gray-500">
        Connect your wallet to access the admin panel.
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
        <p className="text-gray-400">This wallet is not the contract owner.</p>
        <p className="text-xs text-gray-600 mt-1">Owner: {owner ?? 'loading…'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-sm text-gray-400">Connected as owner: <span className="font-mono text-green-400">{address}</span></p>
      </div>

      <AdminSection title="Add Vendor">
        <AddVendorForm />
      </AdminSection>

      <AdminSection title="Add Recipient">
        <AddRecipientForm />
      </AdminSection>

      <AdminSection title="Create Need">
        <CreateNeedForm />
      </AdminSection>

      <AdminSection title="Fulfill Need">
        <FulfillNeedForm />
      </AdminSection>
    </div>
  )
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function AddVendorForm() {
  const [vendorAddr, setVendorAddr] = useState('')
  const [name, setName] = useState('')
  const [metadataHash, setMetadataHash] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.vendorRegistry,
      abi: ABIS.vendorRegistry as Abi,
      functionName: 'addVendor',
      args: [vendorAddr as `0x${string}`, name, metadataHash],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Vendor wallet address" value={vendorAddr} onChange={setVendorAddr} placeholder="0x…" />
      <Field label="Vendor name" value={name} onChange={setName} placeholder="Local Grocery Store" />
      <Field label="Metadata IPFS CID" value={metadataHash} onChange={setMetadataHash} placeholder="Qm…" />
      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess} label="Add Vendor" />
    </form>
  )
}

function AddRecipientForm() {
  const [profileHash, setProfileHash] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.recipientRegistry,
      abi: ABIS.recipientRegistry as Abi,
      functionName: 'addRecipient',
      args: [profileHash],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Recipient profile IPFS CID" value={profileHash} onChange={setProfileHash} placeholder="Qm… (anonymized profile)" />
      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess} label="Add Recipient" />
    </form>
  )
}

function CreateNeedForm() {
  const [recipientId, setRecipientId] = useState('')
  const [vendor, setVendor] = useState('')
  const [descHash, setDescHash] = useState('')
  const [amount, setAmount] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.needRegistry,
      abi: ABIS.needRegistry as Abi,
      functionName: 'createNeed',
      args: [BigInt(recipientId), vendor as `0x${string}`, descHash, parseUsdc(amount)],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Recipient ID" value={recipientId} onChange={setRecipientId} placeholder="0" type="number" />
      <Field label="Vendor address" value={vendor} onChange={setVendor} placeholder="0x…" />
      <Field label="Description IPFS CID" value={descHash} onChange={setDescHash} placeholder="Qm…" />
      <Field label="Target amount (USDC)" value={amount} onChange={setAmount} placeholder="40.00" type="number" />
      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess} label="Create Need" />
    </form>
  )
}

function FulfillNeedForm() {
  const [needId, setNeedId] = useState('')
  const [receiptHash, setReceiptHash] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'fulfillNeed',
      args: [BigInt(needId), receiptHash],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Need ID" value={needId} onChange={setNeedId} placeholder="0" type="number" />
      <Field label="Receipt IPFS CID" value={receiptHash} onChange={setReceiptHash} placeholder="Qm… (proof of purchase)" />
      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess} label="Fulfill Need" />
    </form>
  )
}

// ---- Shared components ----

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono placeholder:font-sans placeholder:text-gray-600"
      />
    </div>
  )
}

function SubmitRow({
  isPending, confirming, isSuccess, label,
}: {
  isPending: boolean; confirming: boolean; isSuccess: boolean; label: string
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        type="submit"
        disabled={isPending || confirming}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
      >
        {(isPending || confirming) && <Loader2 size={14} className="animate-spin" />}
        {confirming ? 'Confirming…' : isPending ? 'Confirm in wallet…' : label}
      </button>
      {isSuccess && (
        <span className="flex items-center gap-1.5 text-green-400 text-sm">
          <CheckCircle size={14} /> Confirmed on-chain
        </span>
      )}
    </div>
  )
}
