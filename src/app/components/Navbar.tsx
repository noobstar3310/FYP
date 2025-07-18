"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const Navbar = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const isActive = (path: string) => {
    return pathname === path
  }

  const navigation = [
    {
      name: "Market",
      href: "/lending-market",
    },
    {
      name: "Credit Score",
      items: [
        { name: "Overview", href: "/finalized-score" },
        { name: "Manual Score", href: "/credit-score" },
      ]
    },
    {
      name: "Analysis",
      items: [
        { name: "Address Age", href: "/address-age" },
        { name: "ERC-20 Holdings", href: "/erc-20-holdings" },
        { name: "DeFi Participation", href: "/participation" },
        { name: "AAVE Positions", href: "/aave-positions" },
      ]
    }
  ]

  return (
    <nav className="border-b border-gray-200 bg-white relative z-50">
      <style jsx>{`
        .nav-link {
          position: relative;
          overflow: hidden;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background-color: black;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }

        .mobile-menu {
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .mobile-menu.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .dropdown-menu {
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 50;
        }

        .dropdown-menu.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .hamburger {
          width: 20px;
          height: 20px;
          position: relative;
          cursor: pointer;
        }

        .hamburger span {
          display: block;
          position: absolute;
          height: 1px;
          width: 100%;
          background: black;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hamburger span:nth-child(1) {
          top: 0;
        }

        .hamburger span:nth-child(2) {
          top: 50%;
          transform: translateY(-50%);
        }

        .hamburger span:nth-child(3) {
          bottom: 0;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg);
          top: 50%;
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg);
          bottom: 50%;
        }

        .wallet-indicator {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl font-light tracking-wide text-black hover:opacity-70 transition-opacity">
            SCOREX
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.href ? (
                  // Single link
                  <Link
                    href={item.href}
                    className={`nav-link text-sm font-medium uppercase tracking-widest transition-colors pb-1 ${
                      isActive(item.href) ? "text-black active" : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {item.name}
                  </Link>
                ) : (
                  // Dropdown
                  <div
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={`nav-link text-sm font-medium uppercase tracking-widest transition-colors pb-1 ${
                        item.items?.some(subItem => isActive(subItem.href)) ? "text-black active" : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {item.name}
                    </button>
                    <div
                      className={`dropdown-menu absolute top-full left-0 mt-1 py-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] ${
                        activeDropdown === item.name ? "open" : ""
                      }`}
                    >
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(subItem.href)
                              ? "text-black bg-gray-50"
                              : "text-gray-500 hover:text-black hover:bg-gray-50"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:block">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="px-6 py-2 border border-black text-black font-medium uppercase tracking-wide text-sm hover:bg-black hover:text-white transition-colors"
                          >
                            Connect
                          </button>
                        )
                      }

                      return (
                        <div className="flex items-center space-x-6">
                          {/* Chain Indicator */}
                          <button
                            onClick={openChainModal}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-black transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500 wallet-indicator"></div>
                            <span className="font-mono uppercase tracking-wide">{chain.name}</span>
                          </button>

                          {/* Balance */}
                          <div className="text-sm font-mono text-gray-600">{account.displayBalance}</div>

                          {/* Account */}
                          <button
                            onClick={openAccountModal}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                            <span className="font-mono text-sm">{account.displayName}</span>
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <div className={`hamburger ${isMenuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden mobile-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="py-6 border-t border-gray-200 space-y-6">
            {/* Mobile Navigation */}
            <div className="space-y-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-lg font-light tracking-wide transition-colors ${
                        isActive(item.href) ? "text-black" : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium uppercase tracking-widest text-gray-400">
                        {item.name}
                      </div>
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block text-lg font-light tracking-wide transition-colors pl-4 ${
                            isActive(subItem.href) ? "text-black" : "text-gray-500 hover:text-black"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-gray-200">
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              className="w-full px-6 py-3 border border-black text-black font-medium uppercase tracking-wide text-sm hover:bg-black hover:text-white transition-colors"
                            >
                              Connect Wallet
                            </button>
                          )
                        }

                        return (
                          <div className="space-y-4">
                            {/* Chain */}
                            <button
                              onClick={openChainModal}
                              className="flex items-center justify-between w-full text-sm text-gray-600"
                            >
                              <span>Network</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="font-mono">{chain.name}</span>
                              </div>
                            </button>

                            {/* Balance */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Balance</span>
                              <span className="font-mono text-gray-600">{account.displayBalance}</span>
                            </div>

                            {/* Account */}
                            <button
                              onClick={openAccountModal}
                              className="flex items-center justify-between w-full text-sm"
                            >
                              <span className="text-gray-600">Account</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-black"></div>
                                <span className="font-mono">{account.displayName}</span>
                              </div>
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
