import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Certifier — Get Certified in Anything',
  description: 'Answer a few questions and earn your certificate of expertise!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900" style={{background: 'linear-gradient(135deg, #0f2340 0%, #1e3a5f 50%, #1e293b 100%)'}}>
        {children}
      </body>
    </html>
  )
}
