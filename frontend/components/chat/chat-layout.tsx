"use client"
import { useState, useEffect } from "react"
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

interface SocketError {
  message: string
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const safeChats = Array.isArray(chats) ? chats : []
  const currentRoom = safeChats.find((chat) => chat.id === activeRoom)

  const getChats = async () => {
    try {
      const response = await fetchWrapper("/chats", "GET")
      if (!response.ok) {
        router.push("/auth/login")
        return
      }
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetchWrapper("/auth", "GET")
        if (!response.ok) {
          router.push("/auth/login")
          return
        }
        const userData = await response.json()
        setCurrentUserId(userData.userId)
        setCurrentUserName(userData.username)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error fetching user info:", error)
        router.push("/auth/login")
      }
    }
    getUserInfo()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    if (!socket.connected) {
      socket.connect()
    }
  
    const refreshToken = async () => {
      try {
        const response = await fetchWrapper("/refreshToken", "POST")
        if (!response.ok) {
          console.error("Failed to refresh token")
          return false
        }
        return true
      } catch (error) {
        console.error("Error refreshing token:", error)
        return false
      }
    }
  
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      toast({
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your connection.",
        variant: "destructive",
      })
    })
  
    socket.on("error", async (error: SocketError) => {
      if (error.message === "Session expired") {
        const success = await refreshToken()
        if (success) {
          socket.disconnect()
          socket.connect()
          return
        }
        router.push("/auth/login")
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    })
  
    return () => {
      socket.off("connect_error")
      socket.off("error")
    }
  }, [isAuthenticated, router, toast])

  useEffect(() => {
    if (!currentUserId) return

    const handleNotification = (data: SocketNotification) => {
      if (data.isActiveChat) return

      const newNotification: Notification = {
        id: data.id,
        type: "message",
        title: `New message from ${data.senderName}`,
        content: data.content,
        timestamp: data.createdAt,
        read: false,
      }

      toast({
        title: newNotification.title,
        description: data.content,
      })
    }

    const handleNewMessage = (message: RoomMessages) => {
      
      if (message.senderID !== currentUserId) {
        setRoomMessages((prevMessages) => {
          const messages = Array.isArray(prevMessages) ? prevMessages : []
          const messageExists = messages.some(m => m.id === message.id)
          if (messageExists) return messages
          
          return [...messages, message]
        })
      }
    }

    socket.on("new_message", handleNewMessage)
    socket.on("notification", handleNotification)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("notification", handleNotification)
    }
  }, [currentUserId, toast])

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await fetchWrapper(`/chat/${activeRoom}`, "GET")
        if (!response.ok) {
          router.push("/auth/login")
          return
        }
        const data = await response.json()
        
        const messages = Array.isArray(data) ? data : []
        setRoomMessages(messages)
      } catch (error) {
        console.error("Error fetching messages:", error)
        setRoomMessages([])
      }
    }

    if (activeRoom && socket) {
      getMessages()
      if (socket.connected) {
        socket.emit("chatID", activeRoom)
      }
    }
  }, [activeRoom])

  useEffect(() => {
    if (isAuthenticated) {
      getChats()
    }
  }, [isAuthenticated])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !currentUserId || !currentUserName) return

    const message = {
      content: newMessage,
      chatId: activeRoom,
    }

    const optimisticMessage: RoomMessages = {
      id: `temp-${Date.now()}`, 
      content: newMessage,
      senderID: currentUserId,
      senderName: currentUserName,
      chatId: activeRoom,
      createdAt: new Date().toISOString(),
    }

    setRoomMessages((prevMessages) => {
      const messages = Array.isArray(prevMessages) ? prevMessages : []
      return [...messages, optimisticMessage]
    })

    if (socket.connected) {
      socket.emit("send_message", message)
    } else {
      console.error("Socket not connected, message not sent")
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please refresh the page.",
        variant: "destructive",
      })
      setRoomMessages((prevMessages) => {
        const messages = Array.isArray(prevMessages) ? prevMessages : []
        return messages.filter(m => m.id !== optimisticMessage.id)
      })
    }
    
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