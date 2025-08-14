'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import apiService from '@/services/apiservices'
import OptimizedAvatar, { useAvatarCache } from '@/components/shared/OptimizedAvatar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Message {
  id: number
  content: string
  sender: {
    id: number
    username: string
    profile_picture?: string
  }
  created_at: string
  is_read: boolean
}

interface ChatRoom {
  id: number
  participants: any[]
  name: string
  is_group: boolean
  other_participant?: any
  other_participant_status?: string
}

const ChatRoomPage = () => {
  const { id } = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const { preloadAvatar, getCacheSize } = useAvatarCache()
  
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  // Avatar caching for fallback
  const [, setAvatarCache] = useState<{ [userId: number]: string }>({})

  // Cache avatar for a user
  const cacheAvatar = (userId: number, avatarUrl: string) => {
    setAvatarCache(prev => ({
      ...prev,
      [userId]: avatarUrl
    }))
  }

  const getStatusColor = (activityStatus: string) => {
    switch (activityStatus) {
      case 'online':
        return 'bg-green-400'
      case 'active':
        return 'bg-yellow-400'
      case 'away':
        return 'bg-orange-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (activityStatus: string) => {
    switch (activityStatus) {
      case 'online':
        return 'Online'
      case 'active':
        return 'Active now'
      case 'away':
        return 'Away'
      default:
        return 'Last seen recently'
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await apiService.post('/api/auth/update-status/', {
        is_online: isOnline
      })
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Set user as online when entering chat
    if (isAuthenticated) {
      updateOnlineStatus(true)
    }

    // Set user as offline when leaving chat
    return () => {
      if (isAuthenticated) {
        updateOnlineStatus(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const fetchChatData = async () => {
      try {
        setLoading(true)
        
        // Fetch chat room details
        const roomResponse = await apiService.get(`/api/chat/rooms/${id}/`)
        setChatRoom(roomResponse)
        
        // Fetch messages
        const messagesResponse = await apiService.get(`/api/chat/rooms/${id}/messages/`)
        const messagesList = messagesResponse.results || messagesResponse
        setMessages(messagesList)
        
        // Pre-cache avatars from existing messages and participants
        const userAvatarMap = new Map<number, string>()
        
        // Cache avatars from messages
        messagesList.forEach((message: Message) => {
          if (message.sender.profile_picture && !userAvatarMap.has(message.sender.id)) {
            userAvatarMap.set(message.sender.id, message.sender.profile_picture)
            // Use optimized preloader
            preloadAvatar(message.sender.id, message.sender.username, message.sender.profile_picture)
          }
        })
        
        // Cache avatar from chat room participants
        if (roomResponse.other_participant?.profile_picture) {
          userAvatarMap.set(roomResponse.other_participant.id, roomResponse.other_participant.profile_picture)
          preloadAvatar(roomResponse.other_participant.id, roomResponse.other_participant.username, roomResponse.other_participant.profile_picture)
        }
        
        // Cache current user avatar
        if (currentUser?.profile_picture) {
          userAvatarMap.set(parseInt(currentUser.id), currentUser.profile_picture)
          preloadAvatar(parseInt(currentUser.id), currentUser.username || 'You', currentUser.profile_picture)
        }
        
        // Update local avatar cache for fallback
        const newAvatarCache: { [userId: number]: string } = {}
        userAvatarMap.forEach((avatarUrl, userId) => {
          newAvatarCache[userId] = avatarUrl
        })
        setAvatarCache(newAvatarCache)
        
        console.log('Pre-cached avatars for users:', Object.keys(newAvatarCache))
        console.log('Global avatar cache size:', getCacheSize())
        
        // Mark messages as read
        await apiService.post(`/api/chat/rooms/${id}/mark_read/`)
        
      } catch (error: any) {
        console.error('Error fetching chat data:', error)
        // If chat room not found or access denied, redirect to chat list
        if (error.response?.status === 404 || error.response?.status === 403) {
          router.push('/chat')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchChatData()

    // Also fetch current user info to compare
    const fetchCurrentUserInfo = async () => {
      try {
        const userResponse = await apiService.get('/api/auth/profile/')
        console.log('Current user from API:', userResponse)
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    
    fetchCurrentUserInfo()

    // Set up WebSocket connection for real-time messages
    const setupWebSocket = () => {
      const protocol = 'ws:'
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        console.error('No access token found for WebSocket connection')
        return
      }
      
      const wsUrl = `${protocol}//127.0.0.1:8000/ws/chat/${id}/?token=${token}`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('WebSocket connected to:', wsUrl)
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('WebSocket received:', data)
        
        if (data.type === 'message') {
          console.log('Message sender profile picture:', data.message.sender.profile_picture)
          
          // Cache avatar from new message using optimized preloader
          if (data.message.sender.profile_picture) {
            cacheAvatar(data.message.sender.id, data.message.sender.profile_picture)
            preloadAvatar(data.message.sender.id, data.message.sender.username, data.message.sender.profile_picture)
          }
          
          setMessages(prev => [...prev, data.message])
        }
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        // Attempt to reconnect after 3 seconds
        setTimeout(setupWebSocket, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    setupWebSocket() // Enable WebSocket for real-time messages

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isAuthenticated, id, router])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      console.log('Sending message from user:', currentUser)
      
      // Try to send via WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending message via WebSocket')
        wsRef.current.send(JSON.stringify({
          type: 'message',
          message: newMessage.trim()
        }))
        
        // Clear the input immediately for better UX
        setNewMessage('')
        setSending(false)
        return
      }
      
      // Fallback to API if WebSocket is not available
      console.log('WebSocket not available, using API fallback')
      const response = await apiService.post(`/api/chat/rooms/${id}/messages/`, {
        content: newMessage.trim()
      })
      
      console.log('Message sent response:', response)
      
      // Add message to local state if WebSocket is not working
      setMessages(prev => [...prev, response])
      setNewMessage('')
      
    } catch (error: any) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <h2 className="h2-bold text-dark200_light900 mb-4">Please Sign In</h2>
          <p className="text-dark400_light800">You need to sign in to access chat.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-dark200_light800">Loading chat...</div>
      </div>
    )
  }

  if (!chatRoom) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <h2 className="h2-bold text-dark200_light900 mb-4">Chat Not Found</h2>
          <p className="text-dark400_light800 mb-6">This chat room doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/chat" className="btn-primary">
            Back to Chats
          </Link>
        </div>
      </div>
    )
  }

  // Use the other_participant provided by the backend API
  const otherParticipant = chatRoom?.other_participant || null

  // Detailed debug logs
  console.log('=== CHAT ROOM DEBUG ===')
  console.log('Current user from AuthContext:', currentUser)
  console.log('Chat room data:', chatRoom)
  console.log('Other participant from API:', otherParticipant)
  console.log('Messages count:', messages.length)
  if (messages.length > 0) {
    console.log('Sample message:', messages[0])
  }
  console.log('=======================')

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto background-light900_dark200 rounded-lg overflow-hidden shadow-lg">
      {/* Modern Chat Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center gap-4 text-white">
        <Link href="/chat" className="hover:bg-white/20 p-2 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <div className="relative">
          <OptimizedAvatar
            userId={otherParticipant?.id || 0}
            username={otherParticipant?.username || 'User'}
            profilePicture={otherParticipant?.profile_picture}
            size="lg"
            className="border-2 border-white/30"
            cacheKey={`header_${otherParticipant?.id}_${otherParticipant?.username}`}
          />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(chatRoom.other_participant_status || 'offline')} rounded-full border-2 border-white`}></div>
        </div>
        
        <div className="flex-1">
          <h2 className="font-bold text-lg">
            {otherParticipant?.username || 'Unknown User'}
          </h2>
          <p className="text-sm text-white/80">
            {chatRoom.is_group ? `${chatRoom.participants.length} members` : getStatusText(chatRoom.other_participant_status || 'offline')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container with Messenger-style Background */}
      <div 
        className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-center h-full">
            <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-dark200_light900 mb-2">Start your conversation</h3>
              <p className="text-dark400_light700">Send a message to begin chatting with {otherParticipant?.username}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              // Determine if this message is from the current user
              const currentUserId = parseInt(currentUser?.id || '0')
              const messageUserId = message.sender.id
              const isOwnMessage = currentUserId === messageUserId
              
              // Debug logs
              if (index === 0) {
                console.log('=== CHAT DEBUG INFO ===')
                console.log('Current user:', currentUser)
                console.log('Current user ID (parsed):', currentUserId)
                console.log('First message sender:', message.sender)
                console.log('First message sender ID:', messageUserId)
                console.log('Is own message:', isOwnMessage)
                console.log('======================')
              }
              
              const showDate = index === 0 || 
                formatMessageDate(messages[index - 1].created_at) !== formatMessageDate(message.created_at)
              const showAvatar = !isOwnMessage && (
                index === messages.length - 1 || 
                messages[index + 1]?.sender.id !== message.sender.id ||
                index === 0 ||
                messages[index - 1]?.sender.id !== message.sender.id
              )

              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="text-xs text-dark400_light500 bg-white/80 dark:bg-gray-700/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                  )}

                  {/* Message with profile picture */}
                  {isOwnMessage ? (
                    /* Your message - Right aligned */
                    <div className="flex justify-end mb-4">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-primary-500 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm">
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">YOU (ID: {message.sender.id})</p>
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1 px-2">
                          <span className="text-xs text-gray-600">
                            {formatMessageTime(message.created_at)}
                          </span>
                          <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Other user message - Left aligned */
                    <div className="flex justify-start items-end gap-2 mb-4">
                      <div className={`w-8 h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        {showAvatar && (
                          <OptimizedAvatar
                            userId={message.sender.id}
                            username={message.sender.username}
                            profilePicture={message.sender.profile_picture}
                            size="md"
                            showBorder={true}
                            cacheKey={`message_${message.sender.id}_${message.sender.username}`}
                          />
                        )}
                      </div>
                      <div className="max-w-xs lg:max-w-md">
                        <div className="bg-white dark:bg-gray-700 text-dark200_light900 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-600">
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">OTHER ({message.sender.username}, ID: {message.sender.id})</p>
                        </div>
                        <div className="flex items-center justify-start gap-1 mt-1 px-2">
                          <span className="text-xs text-dark400_light500">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Modern Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={sendMessage} className="flex items-end gap-3">
          <button type="button" className="text-primary-500 hover:text-primary-600 p-2 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark200_light900 placeholder:text-dark400_light500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32"
              rows={1}
              disabled={sending}
              style={{ height: 'auto', minHeight: '48px' }}
            />
            
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark400_light500 hover:text-primary-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-2xl transition-all ${
              newMessage.trim() && !sending
                ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatRoomPage
