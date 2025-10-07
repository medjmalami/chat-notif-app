"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  name: string
  type: "channel" | "direct"
}

interface Message {
  id: string
  content: string
  senderID: string
  createdAt: string
}

interface ChatAreaProps {
  room?: Room
  messages?: Message[] | null
  newMessage: string
  onMessageChange: (message: string) => void
  onSendMessage: () => void
}

export function ChatArea({ room, messages, newMessage, onMessageChange, onSendMessage }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a room to start chatting</p>
      </div>
    )
  }

  // ✅ Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : []

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          {room.type === "channel" ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-accent" />
          )}
          <h2 className="text-lg font-semibold text-card-foreground">{room.name}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {safeMessages.map((message, index) => {
            const showAvatar = index === 0 || safeMessages[index - 1]?.senderID !== message.senderID
            const isConsecutive = index > 0 && safeMessages[index - 1]?.senderID === message.senderID

            return (
              <div key={message.id} className={cn("flex gap-3", !showAvatar && "ml-11", isConsecutive && "mt-1")}>
                {showAvatar && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {message.senderID.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-foreground">{message.senderID}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                    </div>
                  )}
                  <p className="text-foreground text-pretty leading-relaxed">{message.content}</p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={onSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
