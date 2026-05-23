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

// Always show Coinbase Smart Wallet — no extension or seed phrase needed
coinbaseWallet.preference = 'smartWalletOnly'

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
