import { type Abi } from 'viem'
import DonationEscrowAbi from './abi_DonationEscrow.json'
import NeedRegistryAbi from './abi_NeedRegistry.json'
import VendorRegistryAbi from './abi_VendorRegistry.json'
import RecipientRegistryAbi from './abi_RecipientRegistry.json'

export const ADDRESSES = {
  vendorRegistry:    process.env.NEXT_PUBLIC_VENDOR_REGISTRY_ADDRESS    as `0x${string}`,
  recipientRegistry: process.env.NEXT_PUBLIC_RECIPIENT_REGISTRY_ADDRESS as `0x${string}`,
  needRegistry:      process.env.NEXT_PUBLIC_NEED_REGISTRY_ADDRESS      as `0x${string}`,
  donationEscrow:    process.env.NEXT_PUBLIC_DONATION_ESCROW_ADDRESS    as `0x${string}`,
  usdc:              process.env.NEXT_PUBLIC_USDC_ADDRESS               as `0x${string}`,
}

export const ABIS = {
  donationEscrow:    DonationEscrowAbi    as Abi,
  needRegistry:      NeedRegistryAbi     as Abi,
  vendorRegistry:    VendorRegistryAbi   as Abi,
  recipientRegistry: RecipientRegistryAbi as Abi,
  erc20: [
    { type: 'function', name: 'balanceOf',  inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'allowance',  inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'approve',    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
    { type: 'function', name: 'decimals',   inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  ] as Abi,
}

// USDC uses 6 decimal places
export const USDC_DECIMALS = 6n
export const USDC_UNIT = 10n ** USDC_DECIMALS

export function formatUsdc(raw: bigint): string {
  const dollars = Number(raw) / Number(USDC_UNIT)
  return dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseUsdc(dollars: string): bigint {
  const num = parseFloat(dollars)
  if (isNaN(num) || num <= 0) return 0n
  return BigInt(Math.round(num * Number(USDC_UNIT)))
}

export const NEED_STATUS = ['Open', 'Funded', 'Fulfilled', 'Cancelled'] as const
export type NeedStatus = (typeof NEED_STATUS)[number]

export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs'

export function ipfsUrl(cid: string): string {
  if (!cid) return ''
  return `${IPFS_GATEWAY}/${cid}`
}
