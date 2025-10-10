"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Bell, MessageSquare, Loader } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchWrapper } from "@/lib/fetchWrapper"

interface Notification {
  id: string
  content: string
  senderUsername: string
  messageCreatedAt: string
}

export function NotificationsLayout() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchWrapper("/notifs", "GET")
      
      if (!response.ok) {
        router.push("/auth/login")
        return
      }
      
      const data = await response.json()
      setNotifications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching notifications:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chat">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={fetchNotifications}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chat">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-balance">Notifications</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={isLoading}>
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading notifications...</p>
                </CardContent>
              </Card>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground">
                            <span className="font-semibold">{notification.senderUsername}</span> sent a message
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.messageCreatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}