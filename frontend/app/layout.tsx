'use client'

import type React from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { socket } from '@/lib/socket'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    if (!socket.connected) socket.connect()

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id))
    socket.on('disconnect', () => console.log('❌ Socket disconnected'))

    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
