'use client';

import React from 'react';
import { Users, UserPlus, LineChart } from 'lucide-react';
import Banner from '@/components/Banner';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-900">
      {/* Hero Section */}
      <Banner />
      {/* Features Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-[1600px] mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">
            Why use Splitter?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="group p-8 rounded-3xl transition-all duration-300 hover:bg-gray-50">
              <div className="mb-6 p-4 rounded-full bg-purple-100 inline-block group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Group expense tracking
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Easily add group members to your expense. All the expenses are added up and divided by the number of people in the group.
              </p>
            </div>
            <div className="group p-8 rounded-3xl transition-all duration-300 hover:bg-gray-50">
              <div className="mb-6 p-4 rounded-full bg-indigo-100 inline-block group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Individual expense addition
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Add expenses to your group. You can add your expenses, and they will be automatically added to your group&apos;s expenses.
              </p>
            </div>
            <div className="group p-8 rounded-3xl transition-all duration-300 hover:bg-gray-50">
              <div className="mb-6 p-4 rounded-full bg-purple-100 inline-block group-hover:scale-110 transition-transform duration-300">
                <LineChart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Expense viewing
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                View and manage all your groups in one place. You can see the groups
                you&apos;re a part of, your role in each group, and easily access each
                group&apos;s details.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center text-sm text-gray-500 border-t border-gray-100">
        By using Splitter, you agree to our Terms of Service and Privacy Policy
      </footer>
    </div>
  );
}
