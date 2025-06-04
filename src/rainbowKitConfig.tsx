"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, sepolia, mainnet } from "wagmi/chains";

export default getDefaultConfig({
  appName: "TSender",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  chains: [mainnet, sepolia, anvil],
  ssr: false,
});