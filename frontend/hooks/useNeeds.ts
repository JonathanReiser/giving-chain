'use client'

import { type Abi } from 'viem'
import { useReadContracts } from 'wagmi'
import { ADDRESSES, ABIS } from '@/lib/contracts'

export function useNeedCount() {
  const { data, isLoading } = useReadContracts({
    contracts: [{
      address: ADDRESSES.needRegistry,
      abi: ABIS.needRegistry as Abi,
      functionName: 'needCount',
    }],
  })
  return { count: (data?.[0]?.result as bigint) ?? 0n, isLoading }
}

export function useNeed(needId: bigint) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: ADDRESSES.needRegistry,
        abi: ABIS.needRegistry as Abi,
        functionName: 'getNeed',
        args: [needId],
      },
      {
        address: ADDRESSES.donationEscrow,
        abi: ABIS.donationEscrow as Abi,
        functionName: 'needBalance',
        args: [needId],
      },
    ],
  })

  type RawNeed = {
    recipientId: bigint
    vendor: `0x${string}`
    descriptionHash: string
    targetAmount: bigint
    status: number
    receiptHash: string
    createdAt: bigint
    fulfilledAt: bigint
  }

  const need = data?.[0]?.result as RawNeed | undefined
  const balance = (data?.[1]?.result as bigint) ?? 0n

  return { need, balance, isLoading, refetch }
}

export function useAllNeeds(count: bigint) {
  const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i))

  const needContracts = ids.flatMap((id) => [
    {
      address: ADDRESSES.needRegistry,
      abi: ABIS.needRegistry as Abi,
      functionName: 'getNeed',
      args: [id],
    },
    {
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'needBalance',
      args: [id],
    },
  ])

  const { data, isLoading } = useReadContracts({ contracts: needContracts })

  const needs = ids.map((id, i) => {
    type RawNeed = {
      recipientId: bigint
      vendor: `0x${string}`
      descriptionHash: string
      targetAmount: bigint
      status: number
      receiptHash: string
      createdAt: bigint
      fulfilledAt: bigint
    }
    const need = data?.[i * 2]?.result as RawNeed | undefined
    const balance = (data?.[i * 2 + 1]?.result as bigint) ?? 0n
    return { id, need, balance }
  })

  return { needs, isLoading }
}

export function useDonationLog(count: bigint) {
  const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i))

  const contracts = ids.map((id) => ({
    address: ADDRESSES.donationEscrow,
    abi: ABIS.donationEscrow as Abi,
    functionName: 'getDonation',
    args: [id],
  }))

  const { data, isLoading } = useReadContracts({ contracts })

  type DonationRecord = { donor: `0x${string}`; needId: bigint; amount: bigint; timestamp: bigint }

  const donations = ids.map((_, i) => data?.[i]?.result as DonationRecord | undefined).filter(Boolean)

  return { donations, isLoading }
}

export function useDonationCount() {
  const { data, isLoading } = useReadContracts({
    contracts: [{
      address: ADDRESSES.donationEscrow,
      abi: ABIS.donationEscrow as Abi,
      functionName: 'getDonationCount',
    }],
  })
  return { count: (data?.[0]?.result as bigint) ?? 0n, isLoading }
}
