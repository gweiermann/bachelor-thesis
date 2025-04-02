import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { FullLoadingSpinner } from "@/components/loading-spinner"
import { ReactNode } from "react"
import Navigation from "@/components/navigation"

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

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <Suspense fallback={<div className="size-full fixed"><FullLoadingSpinner /></div>}>
          <div>
            <header>
              <Navigation />
            </header>
            
            <main>
              {children}
            </main>
            
          </div>
        </Suspense>
      </body>
    </html>
  );
}
