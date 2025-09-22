"use client"

import { useState } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { mockRooms, mockUsers, mockMessages } from "@/lib/mock-data"

export function ChatLayout() {
  const [activeRoom, setActiveRoom] = useState(mockRooms[0].id)
  const [newMessage, setNewMessage] = useState("")

  const currentRoom = mockRooms.find((room) => room.id === activeRoom)
  const roomMessages = mockMessages.filter((message) => message.roomId === activeRoom)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // In a real app, this would send the message to the server
    console.log("Sending message:", newMessage, "to room:", activeRoom)
    setNewMessage("")
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar rooms={mockRooms} users={mockUsers} activeRoom={activeRoom} onRoomSelect={setActiveRoom} />
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
