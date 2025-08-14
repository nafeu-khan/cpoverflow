'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import apiService from '@/services/apiservices'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ChatRoom {
  id: number
  name: string
  participants: any[]
  other_participant_status?: string
  last_message: {
    content: string
    sender: any
    created_at: string
  } | null
  unread_count: number
  updated_at: string
}

interface User {
  user: {
    id: string
    username: string
    profile_picture?: string
    activity_status?: string
    is_recently_active?: boolean
    is_online?: boolean
  }
  is_following: boolean
}

const ChatListPage = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const { user: currentUser, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchChatRooms = async () => {
      try {
        const response = await apiService.get('/api/chat/rooms/')
        setChatRooms(response.results || response)
      } catch (error) {
        console.error('Error fetching chat rooms:', error)
        setChatRooms([])
      } finally {
        setLoading(false)
      }
    }

    fetchChatRooms()
  }, [isAuthenticated])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    try {
      setSearchLoading(true)
      // Search through users you follow
      const response = await apiService.get(`/api/community/users/?search=${searchQuery}`)
      // Filter to only show users you're following
      const followingUsers = (response.results || response).filter((user: User) => user.is_following)
      setSearchResults(followingUsers)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const startChatWithUser = async (userId: string) => {
    try {
      const response = await apiService.post('/api/chat/rooms/create/', {
        participant_id: userId
      })
      
      if (response.id) {
        // Navigate to chat room
        window.location.href = `/chat/${response.id}`
      }
    } catch (error) {
      console.error('Error starting chat:', error)
    }
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
        return 'Offline'
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchChatRooms = async () => {
      try {
        const response = await apiService.get('/api/chat/rooms/')
        setChatRooms(response.results || response)
      } catch (error) {
        console.error('Error fetching chat rooms:', error)
        setChatRooms([])
      } finally {
        setLoading(false)
      }
    }

    fetchChatRooms()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-center">
          <h2 className="h2-bold text-dark200_light900 mb-4">Please Sign In</h2>
          <p className="text-dark400_light800">You need to sign in to access your chats.</p>
          <Link href="/sign-in" className="mt-4 inline-block btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="text-dark200_light800">Loading your chats...</div>
      </div>
    )
  }

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.id !== currentUser?.id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex w-full flex-col max-w-4xl mx-auto">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-t-xl text-white">
        <h1 className="text-2xl font-bold mb-2">Messages</h1>
        <p className="text-primary-100">Stay connected with your network</p>
      </div>

      {/* Search bar */}
      <div className="bg-white dark:bg-gray-800 p-4 border-x border-gray-200 dark:border-gray-700">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Search users you follow to start a chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-dark300_light700 placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="bg-white dark:bg-gray-800 border-x border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="font-semibold text-dark200_light900">
              People you follow {searchLoading && '(searching...)'}
            </h3>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div key={user.user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image
                        src={user.user.profile_picture || '/assets/icons/account.svg'}
                        alt={user.user.username}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-gray-200 dark:border-gray-600"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(user.user.activity_status || 'offline')} rounded-full border-2 border-white dark:border-gray-800`}></div>
                    </div>
                    <div>
                      <p className="font-semibold text-dark200_light900">{user.user.username}</p>
                      <p className="text-sm text-gray-500">{getStatusText(user.user.activity_status || 'offline')}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => startChatWithUser(user.user.id)}
                    className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all group-hover:scale-105"
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          ) : !searchLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No users found that you follow matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Chat List */}
      <div className={`bg-white dark:bg-gray-800 ${searchQuery.trim() ? "" : ""} border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl`}>
        {!searchQuery.trim() && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark200_light900 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Recent Conversations
              </h3>
              {chatRooms.length > 0 && (
                <span className="text-sm text-gray-500">{chatRooms.length} chat{chatRooms.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            {chatRooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-dark200_light900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Start meaningful conversations with people you follow. Search above or discover new connections.
                </p>
                <Link 
                  href="/community" 
                  className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  Discover People
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {chatRooms.map((room) => {
                  const otherParticipant = getOtherParticipant(room)
                  
                  return (
                    <Link 
                      key={room.id} 
                      href={`/chat/${room.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
                    >
                      {/* Avatar with status */}
                      <div className="relative">
                        <Image
                          src={otherParticipant?.profile_picture || '/assets/icons/account.svg'}
                          alt={otherParticipant?.username || 'User'}
                          width={56}
                          height={56}
                          className="rounded-full border-2 border-gray-200 dark:border-gray-600 group-hover:border-primary-300 transition-colors"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(room.other_participant_status || 'offline')} rounded-full border-2 border-white dark:border-gray-800`}></div>
                        {room.unread_count > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                            {room.unread_count > 9 ? '9+' : room.unread_count}
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-dark200_light900 truncate group-hover:text-primary-600 transition-colors">
                            {otherParticipant?.username || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-gray-500 font-medium">
                            {room.last_message ? formatTime(room.last_message.created_at) : formatTime(room.updated_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate flex-1 ${room.unread_count > 0 ? 'text-dark200_light900 font-medium' : 'text-gray-500'}`}>
                            {room.last_message ? (
                              <>
                                {room.last_message.sender.id === parseInt(currentUser?.id || '0') && (
                                  <span className="inline-flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                                {room.last_message.content}
                              </>
                            ) : (
                              'Start your conversation...'
                            )}
                          </p>
                          {room.unread_count > 0 && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatListPage
