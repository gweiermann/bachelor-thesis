import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { FullLoadingSpinner } from "@/components/loading-spinner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Next gen coding challenges",
  description: "A coding challenge platform that uses code analysis to give you feedback on your code.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <Suspense fallback={<div className="size-full fixed"><FullLoadingSpinner /></div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
