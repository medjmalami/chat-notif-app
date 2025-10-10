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
        console.error("Failed to fetch chats")
        router.push("/auth/login")
        return
      }
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error("Error fetching chats:", error)
    }
  }

  // Fetch current user info
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

  // Initialize socket connection once user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return

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

    const connectSocket = () => {
      if (!socket.connected) {
        socket.connect()
      }

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id)
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection.",
          variant: "destructive",
        })
      })

      // Listen for socket errors
      socket.on("error", async (error: SocketError) => {
        console.error("Socket error:", error)
        
        // Handle session expired error
        if (error.message === "Session expired") {
          const success = await refreshToken()
          if (success) {
            // Refresh token successful, reconnect socket
            socket.disconnect()
            socket.connect()
            return
          }

          router.push("/auth/login")

        } else {
          // Handle other errors
          toast({
            title: "Error",
            description: error.message || "An error occurred",
            variant: "destructive",
          })
        }
      })
    }

    connectSocket()

    // Only disconnect on actual unmount, not on re-renders
    return () => {
      // Don't disconnect here - let the socket persist
      socket.off("connect")
      socket.off("connect_error")
      socket.off("error")
    }
  }, [isAuthenticated, router, toast])

  // Listen for new messages from other users
  useEffect(() => {
    if (!currentUserId) return

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
      socket.off("notification", handleNotification)
    }
  }, [currentUserId, toast])

  // Load messages when active room changes
  useEffect(() => {
    const getMessages = async () => {
      try {
        console.log("Fetching messages for room:", activeRoom)
        const response = await fetchWrapper(`/chat/${activeRoom}`, "GET")
        if (!response.ok) {
          console.error("Failed to fetch messages")
          router.push("/auth/login")
          return
        }
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
      if (socket.connected) {
        socket.emit("chatID", activeRoom)
      }
    }
  }, [activeRoom])

  // Load chats on mount when authenticated
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
    if (socket.connected) {
      socket.emit("send_message", message)
    } else {
      console.error("Socket not connected, message not sent")
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please refresh the page.",
        variant: "destructive",
      })
      // Remove optimistic message if send failed
      setRoomMessages((prevMessages) => {
        const messages = Array.isArray(prevMessages) ? prevMessages : []
        return messages.filter(m => m.id !== optimisticMessage.id)
      })
    }
    
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