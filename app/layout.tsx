import type React from "react"
import type { Metadata } from "next"
import { Oxanium, Source_Code_Pro } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const oxanium = Oxanium({ subsets: ["latin"] })
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Receipt Splitter - Split Bills Fairly",
  description: "Easily split receipts and bills among friends with our intuitive receipt splitter app",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
