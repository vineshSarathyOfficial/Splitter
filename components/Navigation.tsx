'use client';

import React, { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="backdrop-blur-md bg-white/75 sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              viewBox="0 0 100 100"
              className="h-7 w-7 transition-transform duration-200 ease-out transform group-hover:scale-105"
              fill="#000000"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
              <path 
                d="M30 50 Q45 25 60 50 Q45 75 30 50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="6"
              />
              <path
                d="M70 50 Q55 25 40 50 Q55 75 70 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
              />
            </svg>
            <span className="font-medium text-xl tracking-tight text-black">
              Splitter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-7">
            <Link
              href="/groups"
              className="text-sm font-medium text-gray-900 hover:text-black hover:scale-105 transition-all duration-200 ease-out"
            >
              Your Groups
            </Link>
            <Link
              href="/group"
              className="text-sm font-medium text-gray-900 hover:text-black hover:scale-105 transition-all duration-200 ease-out"
            >
              Create Group
            </Link>
            <Link
              href="/expense"
              className="text-sm font-medium text-gray-900 hover:text-black hover:scale-105 transition-all duration-200 ease-out"
            >
              Add Expense
            </Link>
            <div className="pl-1">
              <UserButton />  
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <div className="mr-2">
              <UserButton />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-900 hover:text-black transition-colors duration-200 ease-out"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden absolute top-14 inset-x-0 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'} transition-all duration-200 ease-out bg-white/75 backdrop-blur-md border-b border-gray-200/50`}>
        <div className="px-4 pt-3 pb-4 space-y-2">
          <Link
            href="/groups"
            className="block px-3 py-2 text-sm font-medium text-gray-900 hover:text-black hover:bg-gray-100/50 transition-all duration-200 ease-out"
          >
            Your Groups
          </Link>
          <Link
            href="/group"
            className="block px-3 py-2 text-sm font-medium text-gray-900 hover:text-black hover:bg-gray-100/50 transition-all duration-200 ease-out"
          >
            Create Group
          </Link>
          <Link
            href="/expense"
            className="block px-3 py-2 text-sm font-medium text-gray-900 hover:text-black hover:bg-gray-100/50 transition-all duration-200 ease-out"
          >
            Add Expense
          </Link>
        </div>
      </div>
    </nav>
  );
}
