"use client"

import { use, useState, useEffect } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { mockMessages } from "@/lib/mock-data"
import { fetchWrapper } from "@/lib/fetchWrapper"

interface Chats {
  id: string
  name: string
  type: "channel" | "direct"
  unreadCount?: number
}

export function ChatLayout() {
  const [activeRoom, setActiveRoom] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [chats, setChats] = useState<Chats[]>([])

  const currentRoom = chats.find((chat) => chat.id === activeRoom)
  const roomMessages = mockMessages.filter((message) => message.roomId === activeRoom)

  useEffect(() => {
    const getChats = async () => {
      const response = await fetchWrapper("/chats", "GET");
      const data = await response.json();
      setChats(data);
    }
    getChats();
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // In a real app, this would send the message to the server
    console.log("Sending message:", newMessage, "to room:", activeRoom)
    setNewMessage("")
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar rooms={chats} activeRoom={activeRoom} onRoomSelect={setActiveRoom} />
      <ChatArea
        room={currentRoom}
        messages={roomMessages}
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
