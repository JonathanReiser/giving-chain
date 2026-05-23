'use client'

import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type Abi } from 'viem'
import { ADDRESSES, ABIS, formatUsdc } from '@/lib/contracts'
import { Loader2, Coins, CheckCircle } from 'lucide-react'

const MINT_AMOUNT = 50_000_000n // $50 USDC

export function DemoFaucet() {
  const { address, isConnected } = useAccount()

  const { data: balanceData, refetch } = useReadContracts({
    contracts: [{
      address: ADDRESSES.usdc,
      abi: ABIS.erc20 as Abi,
      functionName: 'balanceOf',
      args: [address ?? '0x0000000000000000000000000000000000000000'],
    }],
    query: { enabled: isConnected && !!address },
  })

  const balance = (balanceData?.[0]?.result as bigint) ?? 0n

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Refetch balance after confirmation
  if (isSuccess) refetch()

  // Hide if not connected or already has USDC
  if (!isConnected || !address) return null
  if (balance >= 1_000_000n && !isPending && !isConfirming && !isSuccess) return null

  function mint() {
    writeContract({
      address: ADDRESSES.usdc,
      abi: ABIS.erc20 as Abi,
      functionName: 'mint',
      args: [address!, MINT_AMOUNT],
    })
  }

  if (isSuccess) {
    return (
      <div className="bg-green-950 border border-green-800 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle className="text-green-400 shrink-0" size={18} />
        <div>
          <p className="text-sm font-semibold text-green-300">$50 demo USDC added to your wallet!</p>
          <p className="text-xs text-green-500/70">You're ready to donate. Pick a need below.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-950 border border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <Coins className="text-blue-400 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-blue-200">
            {balance === 0n ? "You don't have any demo USDC yet" : `You have $${formatUsdc(balance)} demo USDC`}
          </p>
          <p className="text-xs text-blue-400/80">
            This is a demo — get free test tokens to try a real donation
          </p>
        </div>
      </div>
      <button
        onClick={mint}
        disabled={isPending || isConfirming}
        className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        {(isPending || isConfirming) && <Loader2 size={14} className="animate-spin" />}
        {isPending ? 'Confirm in wallet…' : isConfirming ? 'Minting…' : 'Get $50 Demo USDC'}
      </button>
    </div>
  )
}
