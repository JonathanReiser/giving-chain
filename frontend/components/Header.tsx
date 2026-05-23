'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { usePathname } from 'next/navigation'
import { Wallet } from 'lucide-react'

const navLinks = [
  { href: '/',             label: 'Browse Needs' },
  { href: '/transparency', label: 'Transparency' },
  { href: '/admin',        label: 'Admin' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-400 shrink-0">
          <span className="text-2xl">⛓️</span>
          GivingChain
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-green-950 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Custom connect button — friendlier for non-crypto users */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
            const connected = mounted && account && chain

            if (!mounted) return <div className="w-32 h-9 bg-gray-800 rounded-xl animate-pulse" />

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <Wallet size={15} />
                  Connect to Donate
                </button>
              )
            }

            if (chain.unsupported) {
              return (
                <button onClick={openChainModal}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                  Wrong Network
                </button>
              )
            }

            return (
              <button
                onClick={openAccountModal}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-2 rounded-xl text-sm transition-colors"
              >
                {account.ensAvatar
                  ? <img src={account.ensAvatar} alt="avatar" className="w-5 h-5 rounded-full" />
                  : <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">
                      {account.displayName?.[0] ?? '?'}
                    </div>
                }
                <span className="text-gray-200 font-medium">{account.displayName}</span>
              </button>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}
