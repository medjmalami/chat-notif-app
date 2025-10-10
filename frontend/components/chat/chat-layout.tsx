"use client"
import { useState, useEffect, useRef } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { fetchWrapper } from "@/lib/fetchWrapper"
import { socket } from "@/lib/socket"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  senderName: string
  chatId: string
}

interface SocketNotification {
  id: string
  chatId: string
  senderId: string
  content: string
  createdAt: string
  senderName: string
  isActiveChat: boolean
}

interface Notification {
  id: string
  type: "message" | "user_joined" | "system" | "mention"
  title: string
  content: string
  timestamp: string
  read: boolean
}

export function ChatLayout() {
  const [activeRoom, setActiveRoom] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [chats, setChats] = useState<Chats[]>([])
  const [roomMessages, setRoomMessages] = useState<RoomMessages[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()
  
  const safeChats = Array.isArray(chats) ? chats : []
  const currentRoom = safeChats.find((chat) => chat.id === activeRoom)

  const getChats = async () => {
    const response = await fetchWrapper("/chats", "GET")
    const data = await response.json()
    setChats(data)
  }

  // Fetch current user info
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetchWrapper("/auth", "GET")
        if (!response.ok) {
          router.push("/auth/login")
        }
        const userData = await response.json()
        setCurrentUserId(userData.userId)
        setCurrentUserName(userData.username)
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }
    getUserInfo()
  }, [])

  // Initialize socket connection once
  useEffect(() => {

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Listen for new messages from other users
  useEffect(() => {
    const handleNotification = (data: SocketNotification) => {
      // Only process if it's not an active chat notification
      if (data.isActiveChat) return

      const newNotification: Notification = {
        id: data.id,
        type: "message",
        title: `New message from ${data.senderName}`,
        content: data.content,
        timestamp: data.createdAt,
        read: false,
      }

      // Show toast notification
      toast({
        title: newNotification.title,
        description: data.content,
      })
    }

    const handleNewMessage = (message: RoomMessages) => {
      console.log("Received new message:", message)
      
      // Only add message if it's not from current user (to avoid duplicates)
      if (message.senderID !== currentUserId) {
        setRoomMessages((prevMessages) => {
          const messages = Array.isArray(prevMessages) ? prevMessages : []
          // Check if message already exists to prevent duplicates
          const messageExists = messages.some(m => m.id === message.id)
          if (messageExists) return messages
          
          console.log("Adding message from other user")
          return [...messages, message]
        })
      }
    }

    socket.on("new_message", handleNewMessage)
    socket.on("notification", handleNotification)

    return () => {
      socket.off("new_message", handleNewMessage)
    }
  }, [currentUserId])

  // Load messages when active room changes
  useEffect(() => {
    const getMessages = async () => {
      try {
        console.log("Fetching messages for room:", activeRoom)
        const response = await fetchWrapper(`/chat/${activeRoom}`, "GET")
        const data = await response.json()
        console.log("Received messages:", data)
        
        const messages = Array.isArray(data) ? data : []
        setRoomMessages(messages)
        console.log("Set room messages:", messages.length, "messages")
      } catch (error) {
        console.error("Error fetching messages:", error)
        setRoomMessages([])
      }
    }

    if (activeRoom && socket) {
      getMessages()
      socket.emit("chatID", activeRoom)
    }
  }, [activeRoom])

  // Load chats on mount
  useEffect(() => {
    getChats()
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !currentUserId || !currentUserName) return

    const message = {
      content: newMessage,
      chatId: activeRoom,
    }

    // Create optimistic message to show immediately
    const optimisticMessage: RoomMessages = {
      id: `temp-${Date.now()}`, // Temporary ID until server responds
      content: newMessage,
      senderID: currentUserId,
      senderName: currentUserName,
      chatId: activeRoom,
      createdAt: new Date().toISOString(),
    }

    // Add message to UI immediately for current user
    setRoomMessages((prevMessages) => {
      const messages = Array.isArray(prevMessages) ? prevMessages : []
      return [...messages, optimisticMessage]
    })

    // Send message through socket
    socket.emit("send_message", message)
    
    // Clear input
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