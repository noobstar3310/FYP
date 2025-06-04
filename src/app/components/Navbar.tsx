"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div>
            <Link href="/" className="text-xl font-light tracking-tight hover:text-gray-600 transition-colors">
              Scorex
            </Link>
          </div>

          {/* Custom Connect Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

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
                          className="text-sm font-light hover:text-gray-600 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-6">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-black"></div>
                          <span className="text-sm">{chain.name}</span>
                        </button>

                        <div className="text-sm font-mono">
                          {account.displayBalance}
                        </div>

                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                          <span className="font-mono">
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 