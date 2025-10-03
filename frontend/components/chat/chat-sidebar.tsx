"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Hash, Users, Bell, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchWrapper } from "@/lib/fetchWrapper"
import { useRouter } from "next/navigation"

interface Room {
  id: string
  name: string
  type: "channel" | "direct"
  unreadCount?: number
}

interface User {
  id: string
  username: string
  status: "online" | "away" | "offline"
}

interface ChatSidebarProps {
  rooms: Room[]
  users: User[]
  activeRoom: string
  onRoomSelect: (roomId: string) => void
}

export function ChatSidebar({ rooms, users, activeRoom, onRoomSelect }: ChatSidebarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const channels = rooms.filter((room) => room.type === "channel")
  const directMessages = rooms.filter((room) => room.type === "direct")
  const onlineUsers = users.filter((user) => user.status === "online")

  const router = useRouter()

  const handleLogout = async () => {
    if (isLoggingOut) return // prevent double click
    setIsLoggingOut(true)
    await fetchWrapper("/logout", "GET")
    setIsLoggingOut(false)
    router.push("/auth/login")

  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">ChatApp</h1>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-sidebar-border">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="flex-1 justify-start" asChild>
            <Link href="/notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Channels */}
          <div>
            <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2 px-2">
              Channels
            </h3>
            <div className="space-y-1">
              {channels.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activeRoom === room.id && "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                  onClick={() => onRoomSelect(room.id)}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  <span className="truncate">{room.name}</span>
                  {room.unreadCount && room.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                      {room.unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Direct Messages */}
          <div>
            <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2 px-2">
              Direct Messages
            </h3>
            <div className="space-y-1">
              {directMessages.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activeRoom === room.id && "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                  onClick={() => onRoomSelect(room.id)}
                >
                  <div className="h-2 w-2 rounded-full bg-accent mr-3" />
                  <span className="truncate">{room.name}</span>
                  {room.unreadCount && room.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                      {room.unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Online Users */}
          <div>
            <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2 px-2 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              Online ({onlineUsers.length})
            </h3>
            <div className="space-y-1">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 px-2 py-1 text-sm text-sidebar-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.username}</span>
                  <div className="h-2 w-2 rounded-full bg-accent ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
