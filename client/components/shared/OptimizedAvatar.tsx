import React, { memo, useState, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OptimizedAvatarProps {
  userId: number
  username: string
  profilePicture?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showBorder?: boolean
  cacheKey?: string
}

// Create a global avatar cache that persists across component re-renders
const globalAvatarCache = new Map<string, string>()
const loadingStates = new Map<string, boolean>()

const OptimizedAvatar = memo(({
  userId,
  username,
  profilePicture,
  size = 'md',
  className = '',
  showBorder = false,
  cacheKey
}: OptimizedAvatarProps) => {
  const cacheKeyString = cacheKey || `${userId}_${username}`
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  // Check if image is already cached
  const cachedUrl = globalAvatarCache.get(cacheKeyString)
  const avatarUrl = cachedUrl || profilePicture

  // Cache the URL when component mounts with a new URL
  React.useEffect(() => {
    if (profilePicture && !cachedUrl) {
      globalAvatarCache.set(cacheKeyString, profilePicture)
    }
  }, [profilePicture, cachedUrl, cacheKeyString])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    setImageError(false)
    loadingStates.set(cacheKeyString, false)
  }, [cacheKeyString])

  const handleImageError = useCallback(() => {
    setImageLoaded(false)
    setImageError(true)
    loadingStates.set(cacheKeyString, false)
    // Remove from cache if there was an error
    globalAvatarCache.delete(cacheKeyString)
  }, [cacheKeyString])

  const handleImageLoadStart = useCallback(() => {
    loadingStates.set(cacheKeyString, true)
  }, [cacheKeyString])

  // Size configurations
  const sizeConfig = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const sizeClass = sizeConfig[size]
  const borderClass = showBorder ? 'border border-gray-200 dark:border-gray-600' : ''
  const finalClassName = `${sizeClass} ${borderClass} ${className}`

  return (
    <Avatar className={finalClassName}>
      {avatarUrl && !imageError ? (
        <AvatarImage
          src={avatarUrl}
          alt={username}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleImageLoadStart}
          // Add cache-busting only if needed
          loading="lazy"
          style={{
            transition: 'opacity 0.2s ease-in-out',
            opacity: imageLoaded ? 1 : 0.8
          }}
        />
      ) : null}
      <AvatarFallback 
        className={`
          ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-200 font-semibold text-sm
          bg-gradient-to-br from-primary-400 to-primary-600 text-white
        `}
      >
        {username?.charAt(0)?.toUpperCase() || 'U'}
      </AvatarFallback>
    </Avatar>
  )
})

OptimizedAvatar.displayName = 'OptimizedAvatar'

// Export a hook to manage the global cache
export const useAvatarCache = () => {
  const clearCache = useCallback(() => {
    globalAvatarCache.clear()
    loadingStates.clear()
  }, [])

  const getCacheSize = useCallback(() => {
    return globalAvatarCache.size
  }, [])

  const preloadAvatar = useCallback((userId: number, username: string, url: string) => {
    const cacheKey = `${userId}_${username}`
    if (!globalAvatarCache.has(cacheKey)) {
      // Create an image element to preload
      const img = new Image()
      img.onload = () => {
        globalAvatarCache.set(cacheKey, url)
      }
      img.src = url
    }
  }, [])

  return {
    clearCache,
    getCacheSize,
    preloadAvatar
  }
}

export default OptimizedAvatar
