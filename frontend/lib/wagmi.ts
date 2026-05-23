'use client'

import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// Show Smart Wallet (passkey/Face ID) for new users, Coinbase Wallet
// app for existing users — broadest compatibility
coinbaseWallet.preference = { options: 'all' }

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, metaMaskWallet, walletConnectWallet, injectedWallet],
    },
  ],
  { appName: 'GivingChain', projectId }
)

export const wagmiConfig = createConfig({
  connectors,
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
})
