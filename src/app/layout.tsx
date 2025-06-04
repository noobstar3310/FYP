import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ReactNode } from "react";
import Navbar from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "Scrorex",
  description: "Next gen on chain credit scoring",
};

export default function RootLayout(props: {
  children: ReactNode
}){
  return (
    <html lang="en">
      <body>
        <Providers>
        <Navbar />
          {props.children}
          </Providers>
      </body>
    </html>
  );
}
