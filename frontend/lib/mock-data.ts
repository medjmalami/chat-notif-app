
export const mockNotifications = [
  {
    id: "1",
    type: "message" as const,
    title: "New message in #general",
    content: "Alice Johnson: Did anyone see the latest design mockups?",
    timestamp: "2024-01-15T14:00:00Z",
    read: false,
  },
  {
    id: "2",
    type: "user_joined" as const,
    title: "User joined",
    content: "Eve Wilson joined the workspace",
    timestamp: "2024-01-15T13:30:00Z",
    read: false,
  },
  {
    id: "3",
    type: "message" as const,
    title: "5 new messages while you were offline",
    content: "You have unread messages in #development and #general",
    timestamp: "2024-01-15T12:00:00Z",
    read: true,
  },
  {
    id: "4",
    type: "system" as const,
    title: "System maintenance",
    content: "Scheduled maintenance will occur tonight at 2 AM EST",
    timestamp: "2024-01-15T10:00:00Z",
    read: true,
  },
  {
    id: "5",
    type: "mention" as const,
    title: "You were mentioned",
    content: "Bob Smith mentioned you in #development",
    timestamp: "2024-01-15T09:45:00Z",
    read: true,
  },
]
