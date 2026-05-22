'use client'

import { type Abi } from 'viem'
import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ADDRESSES, ABIS, USDC_UNIT, parseUsdc, formatUsdc } from '@/lib/contracts'
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface DonateModalProps {
  needId: bigint
  targetAmount: bigint
  funded: bigint
  onClose: () => void
  onSuccess: () => void
}

export function DonateModal({ needId, targetAmount, funded, onClose, onSuccess }: DonateModalProps) {
  const { address } = useAccount()
  const [amountStr, setAmountStr] = useState('')
  const remaining = targetAmount - funded
  const amount = parseUsdc(amountStr)

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.usdc,
        abi: ABIS.erc20 as Abi,
        functionName: 'balanceOf',
        args: [address ?? '0x0'],
      },
      {
        address: ADDRESSES.usdc,
        abi: ABIS.erc20 as Abi,
        functionName: 'allowance',
        args: [address ?? '0x0', ADDRESSES.donationEscrow],
      },
    ],
    query: { enabled: !!address },
  })

  const balance = (contractData?.[0]?.result as bigint) ?? 0n
  const allowance = (contractData?.[1]?.result as bigint) ?? 0n
  const needsApproval = amount > 0n && allowance < amount

  const { writeContract: approve, data: approveTxHash, isPending: approving } = useWriteContract()
  const { writeContract: donate, data: donateTxHash, isPending: donating } = useWriteContract()

  const { isLoading: awaitingApproval, isSuccess: approvalDone } = useWaitForTransactionReceipt({ hash: approveTxHash })
  const { isLoading: awaitingDonation, isSuccess: donationDone } = useWaitForTransactionReceipt({ hash: donateTxHash })

  useEffect(() => {
    if (donationDone) {
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    }
  }, [donationDone, onSuccess, onClose])

  function handleApprove() {
    approve({
      address: ADDRESSES.usdc,
      abi: ABIS.erc20 as Abi,
      functionName: 'approve',
      args: [ADDRESSES.donationEscrow, amount],
    })
  }

  function handleDonate() {
    donate({
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'donate',
      args: [needId, amount],
    })
  }

  const tooLow = amount > 0n && amount < USDC_UNIT / 100n
  const tooHigh = amount > balance
  const invalid = tooLow || tooHigh || amount === 0n

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Donate USDC</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Still needed</span>
              <span className="text-green-400 font-medium">${formatUsdc(remaining)} USDC</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Your balance</span>
              <span>{formatUsdc(balance)} USDC</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (USDC)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-4 py-3 text-lg font-mono focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 25, 50].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmountStr(String(Math.min(v, Number(remaining) / 1e6)))}
                  className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-100 transition-colors"
                >
                  ${v}
                </button>
              ))}
              <button
                onClick={() => setAmountStr((Number(remaining) / 1e6).toFixed(2))}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-100 transition-colors"
              >
                Max needed
              </button>
            </div>
          </div>

          {tooHigh && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} />
              Insufficient balance
            </div>
          )}

          {donationDone && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle size={14} />
              Donation confirmed on-chain!
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {needsApproval && !approvalDone ? (
              <button
                disabled={invalid || approving || awaitingApproval}
                onClick={handleApprove}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {(approving || awaitingApproval) && <Loader2 size={14} className="animate-spin" />}
                {awaitingApproval ? 'Approving…' : approving ? 'Confirm in wallet…' : '1. Approve USDC'}
              </button>
            ) : (
              <button
                disabled={invalid || donating || awaitingDonation || donationDone}
                onClick={handleDonate}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {(donating || awaitingDonation) && <Loader2 size={14} className="animate-spin" />}
                {awaitingDonation ? 'Confirming…' : donating ? 'Confirm in wallet…' : donationDone ? 'Done!' : 'Donate'}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            Funds are held in a smart contract until the nonprofit uploads a receipt and releases them directly to the vendor.
          </p>
        </div>
      </div>
    </div>
  )
}
