'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/',              label: 'Browse Needs' },
  { href: '/transparency',  label: 'Transparency' },
  { href: '/admin',         label: 'Admin' },
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

        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus="avatar"
        />
      </div>
    </header>
  )
}
