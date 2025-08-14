'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/sign-in">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/sign-up">
          <Button>Sign Up</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        className="flex items-center space-x-2"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={user.profile_picture || ''} 
            alt={user.username}
          />
          <AvatarFallback className="text-sm">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span>{user.username}</span>
      </Button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <div className="py-1">
            <Link 
              href={`/profile/${user.username}`} 
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsDropdownOpen(false)}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
            
            <button
              onClick={() => {
                handleLogout();
                setIsDropdownOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
