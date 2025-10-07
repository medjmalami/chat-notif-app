"use client"
import { useState, useEffect } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { fetchWrapper } from "@/lib/fetchWrapper"

interface Chats {
  id: string
  name: string
  type: "channel" | "direct"
  unreadCount?: number
}

interface RoomMessages {
  id: string
  content: string
  senderID: string
  createdAt: string
}

export function ChatLayout() {
  const [activeRoom, setActiveRoom] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [chats, setChats] = useState<Chats[]>([])
  const [roomMessages, setRoomMessages] = useState<RoomMessages[]>([])
  
  const currentRoom = chats.find((chat) => chat.id === activeRoom)

  const getChats = async () => {
    const response = await fetchWrapper("/chats", "GET")
    const data = await response.json()
    setChats(data)
  }

  useEffect(() => {
    const getMessages = async () => {
      const response = await fetchWrapper(`/chats/${activeRoom}`, "GET")
      const data = await response.json()
      setRoomMessages(data)
    }
    
    if (activeRoom) {
      getMessages()
    }
  }, [activeRoom])

  useEffect(() => {
    getChats()
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    console.log("Sending message:", newMessage, "to room:", activeRoom)
    setNewMessage("")
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar 
        rooms={chats} 
        activeRoom={activeRoom} 
        onRoomSelect={setActiveRoom}
        onChatCreated={getChats}
      />
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