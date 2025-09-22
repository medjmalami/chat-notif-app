"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Bell, MessageSquare, UserPlus, Settings, AtSign, CheckCheck } from "lucide-react"
import { mockNotifications } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "message" | "user_joined" | "system" | "mention"
  title: string
  content: string
  timestamp: string
  read: boolean
}

export function NotificationsLayout() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const unreadCount = notifications.filter((n) => !n.read).length
  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "user_joined":
        return <UserPlus className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
      case "mention":
        return <AtSign className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return "text-primary"
      case "user_joined":
        return "text-accent"
      case "system":
        return "text-muted-foreground"
      case "mention":
        return "text-secondary"
      default:
        return "text-muted-foreground"
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
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All ({notifications.length})
          </Button>
          <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    !notification.read && "border-primary/50 bg-primary/5",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-1", getNotificationColor(notification.type))}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-foreground text-pretty">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                            {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
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
