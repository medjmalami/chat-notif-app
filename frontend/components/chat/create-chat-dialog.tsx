"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import { fetchWrapper } from "@/lib/fetchWrapper"

interface User {
  id: string
  name: string
}

interface CreateChatDialogProps {
  onChatCreated: () => void
}

export function CreateChatDialog({ onChatCreated }: CreateChatDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"channel" | "direct">("channel")
  const [users, setUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const response = await fetchWrapper("/users", "GET")
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (open) {
      fetchUsers()
    }
  }, [open])

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async () => {
    if (!name.trim() || selectedMembers.length === 0) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetchWrapper("/addchat", "POST", {
        name,
        type,
        chatMembers: selectedMembers,
      })

      if (response.ok) {
        setName("")
        setType("channel")
        setSelectedMembers([])
        setOpen(false)
        onChatCreated()
      }
    } catch (error) {
      console.error("Failed to create chat:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen)
      if (!newOpen) {
        setName("")
        setType("channel")
        setSelectedMembers([])
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Create New Chat</DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a new channel or direct message conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-gray-900">Name</Label>
            <Input
              id="name"
              placeholder="Enter chat name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type" className="text-gray-900">Type</Label>
            <Select value={type} onValueChange={(value: "channel" | "direct") => setType(value)}>
              <SelectTrigger id="type" className="bg-white border-gray-300 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="channel" className="text-gray-900">Channel</SelectItem>
                <SelectItem value="direct" className="text-gray-900">Direct Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-gray-900">Members ({selectedMembers.length} selected)</Label>
            <ScrollArea className="h-[200px] rounded-md border border-gray-300 bg-white p-4">
              <div className="space-y-3">
                {isLoadingUsers ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <p className="text-sm text-gray-500 text-center">No other users available</p>
                    <p className="text-xs text-gray-400 text-center mt-1">You're the only user in the system</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => handleMemberToggle(user.id)}
                        className="border-gray-300"
                      />
                      <label
                        htmlFor={user.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-900"
                      >
                        {user.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedMembers.length === 0 || isSubmitting || users.length === 0}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}