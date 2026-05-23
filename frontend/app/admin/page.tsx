'use client'

import { type Abi } from 'viem'
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { ADDRESSES, ABIS, parseUsdc } from '@/lib/contracts'
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react'

// ---- IPFS helper ----
async function pinToIPFS(content: object, name: string): Promise<string> {
  const res = await fetch('/api/ipfs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, name }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.cid as string
}

// ---- Page ----
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
      <div className="max-w-lg mx-auto py-24 space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="text-red-400" size={32} />
        </div>
        <p className="text-center text-gray-400">Not authorized</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs font-mono space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">Your wallet</span>
            <span className="text-yellow-400 break-all">{address ?? 'not connected'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">Contract owner</span>
            <span className="text-green-400 break-all">{owner ?? 'loading…'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">Match</span>
            <span className={owner ? 'text-red-400' : 'text-gray-500'}>
              {owner ? 'no' : 'waiting for contract read…'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 shrink-0">Escrow address</span>
            <span className="text-gray-400 break-all">{ADDRESSES.donationEscrow}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-sm text-gray-400">
          Connected as owner: <span className="font-mono text-green-400">{address}</span>
        </p>
      </div>

      <AdminSection title="1. Add Vendor">
        <AddVendorForm />
      </AdminSection>

      <AdminSection title="2. Add Recipient">
        <AddRecipientForm />
      </AdminSection>

      <AdminSection title="3. Create Need">
        <CreateNeedForm />
      </AdminSection>

      <AdminSection title="4. Fulfill Need">
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

// ---- Add Vendor ----
function AddVendorForm() {
  const [vendorAddr, setVendorAddr] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [cid, setCid] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  async function upload() {
    setUploading(true)
    setUploadError('')
    try {
      const result = await pinToIPFS(
        { name, description, location, website, type: 'vendor' },
        `vendor-${name}`
      )
      setCid(result)
    } catch (e) {
      setUploadError(String(e))
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.vendorRegistry,
      abi: ABIS.vendorRegistry as Abi,
      functionName: 'addVendor',
      args: [vendorAddr as `0x${string}`, name, cid],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Vendor wallet address" value={vendorAddr} onChange={setVendorAddr} placeholder="0x…" />
      <Field label="Vendor name" value={name} onChange={setName} placeholder="Local Grocery Store" />
      <Field label="Description" value={description} onChange={setDescription} placeholder="Locally owned grocery serving the south side…" />
      <Field label="Location" value={location} onChange={setLocation} placeholder="Chicago, IL" />
      <Field label="Website (optional)" value={website} onChange={setWebsite} placeholder="https://…" />

      <UploadRow
        cid={cid}
        uploading={uploading}
        error={uploadError}
        disabled={!name || !description}
        onUpload={upload}
      />

      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess}
        label="Add Vendor" disabled={!cid || !vendorAddr} />
    </form>
  )
}

// ---- Add Recipient ----
function AddRecipientForm() {
  const [firstName, setFirstName] = useState('')
  const [location, setLocation] = useState('')
  const [story, setStory] = useState('')
  const [cid, setCid] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  async function upload() {
    setUploading(true)
    setUploadError('')
    try {
      const result = await pinToIPFS(
        { firstName, location, story, type: 'recipient' },
        `recipient-${firstName}`
      )
      setCid(result)
    } catch (e) {
      setUploadError(String(e))
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.recipientRegistry,
      abi: ABIS.recipientRegistry as Abi,
      functionName: 'addRecipient',
      args: [cid],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-gray-500">Profile is stored on IPFS — use only anonymized information.</p>
      <Field label="First name only" value={firstName} onChange={setFirstName} placeholder="Maria" />
      <Field label="General location" value={location} onChange={setLocation} placeholder="Chicago, IL" />
      <Field label="Their story" value={story} onChange={setStory} placeholder="Single mother of three working two jobs…" textarea />

      <UploadRow
        cid={cid}
        uploading={uploading}
        error={uploadError}
        disabled={!firstName || !story}
        onUpload={upload}
      />

      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess}
        label="Add Recipient" disabled={!cid} />
    </form>
  )
}

// ---- Create Need ----
function CreateNeedForm() {
  const [recipientId, setRecipientId] = useState('')
  const [vendor, setVendor] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState('')
  const [cid, setCid] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  async function upload() {
    setUploading(true)
    setUploadError('')
    try {
      const result = await pinToIPFS(
        { title, description, category, targetAmount: amount, type: 'need' },
        `need-${title}`
      )
      setCid(result)
    } catch (e) {
      setUploadError(String(e))
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.needRegistry,
      abi: ABIS.needRegistry as Abi,
      functionName: 'createNeed',
      args: [BigInt(recipientId), vendor as `0x${string}`, cid, parseUsdc(amount)],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Recipient ID" value={recipientId} onChange={setRecipientId} placeholder="0" type="number" />
      <Field label="Vendor wallet address" value={vendor} onChange={setVendor} placeholder="0x…" />
      <Field label="Need title" value={title} onChange={setTitle} placeholder="Weekly groceries" />
      <Field label="Description" value={description} onChange={setDescription}
        placeholder="Family of 4 needs groceries for the week — milk, bread, eggs…" textarea />
      <div>
        <label className="block text-sm text-gray-400 mb-1">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500">
          {['food', 'medicine', 'clothing', 'hygiene', 'utilities', 'other'].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      <Field label="Target amount (USDC)" value={amount} onChange={setAmount} placeholder="40.00" type="number" />

      <UploadRow
        cid={cid}
        uploading={uploading}
        error={uploadError}
        disabled={!title || !description || !amount}
        onUpload={upload}
      />

      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess}
        label="Create Need" disabled={!cid || !recipientId || !vendor} />
    </form>
  )
}

// ---- Fulfill Need ----
function FulfillNeedForm() {
  const [needId, setNeedId] = useState('')
  const [vendor, setVendor] = useState('')
  const [receiptDate, setReceiptDate] = useState('')
  const [receiptNote, setReceiptNote] = useState('')
  const [cid, setCid] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  async function upload() {
    setUploading(true)
    setUploadError('')
    try {
      const result = await pinToIPFS(
        { needId, vendor, receiptDate, note: receiptNote, type: 'receipt' },
        `receipt-need-${needId}`
      )
      setCid(result)
    } catch (e) {
      setUploadError(String(e))
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    writeContract({
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'fulfillNeed',
      args: [BigInt(needId), cid],
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Need ID" value={needId} onChange={setNeedId} placeholder="0" type="number" />
      <Field label="Vendor name / store" value={vendor} onChange={setVendor} placeholder="Local Grocery Store" />
      <Field label="Purchase date" value={receiptDate} onChange={setReceiptDate} type="date" placeholder="" />
      <Field label="Receipt notes" value={receiptNote} onChange={setReceiptNote}
        placeholder="Purchased: milk, bread, eggs, rice, beans. Total: $40.00" textarea />

      <UploadRow
        cid={cid}
        uploading={uploading}
        error={uploadError}
        disabled={!needId || !receiptDate}
        onUpload={upload}
      />

      <SubmitRow isPending={isPending} confirming={confirming} isSuccess={isSuccess}
        label="Fulfill Need" disabled={!cid || !needId} />
    </form>
  )
}

// ---- Shared components ----

function Field({
  label, value, onChange, placeholder, type = 'text', textarea = false,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; type?: string; textarea?: boolean
}) {
  const cls = "w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors placeholder:text-gray-600"
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} rows={3} className={cls} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function UploadRow({ cid, uploading, error, disabled, onUpload }: {
  cid: string; uploading: boolean; error: string; disabled: boolean; onUpload: () => void
}) {
  return (
    <div className="space-y-1.5">
      <button type="button" onClick={onUpload} disabled={disabled || uploading || !!cid}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm transition-colors">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? 'Uploading to IPFS…' : cid ? 'Uploaded ✓' : 'Upload to IPFS'}
      </button>
      {cid && (
        <p className="text-xs font-mono text-green-400 break-all">CID: {cid}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

function SubmitRow({ isPending, confirming, isSuccess, label, disabled }: {
  isPending: boolean; confirming: boolean; isSuccess: boolean; label: string; disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button type="submit" disabled={disabled || isPending || confirming}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2">
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
