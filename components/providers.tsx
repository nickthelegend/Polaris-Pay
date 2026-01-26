"use client"

import type React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmkr3rc4i00iujs0cgnug0qzj"}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          }
        },
        defaultChain: {
          id: 102033,
          name: "Creditcoin USC Testnet",
          network: "usc-testnet",
          nativeCurrency: {
            name: "tCTC",
            symbol: "tCTC",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["https://rpc.usc-testnet.creditcoin.network"],
            },
            public: {
              http: ["https://rpc.usc-testnet.creditcoin.network"],
            },
          },
        },
        supportedChains: [
          {
            id: 102033,
            name: "Creditcoin USC Testnet",
            network: "usc-testnet",
            nativeCurrency: { name: "tCTC", symbol: "tCTC", decimals: 18 },
            rpcUrls: {
              default: { http: ["https://rpc.usc-testnet.creditcoin.network"] },
              public: { http: ["https://rpc.usc-testnet.creditcoin.network"] },
            },
          },
          {
            id: 1337,
            name: "Localnet",
            network: "localnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: {
              default: { http: ["http://127.0.0.1:7545"] },
              public: { http: ["http://127.0.0.1:7545"] },
            },
          }
        ]
      }}
    >
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </PrivyProvider>
  )
}

