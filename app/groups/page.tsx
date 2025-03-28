'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useOrganizationList, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';

// Define the type for group
type Group = {
  id: string; // Add id property
  name: string;
  role: string;
  initials: string;
};

const GroupItem = ({
  name,
  role,
  initials,
  id,
}: {
  name: string;
  role: string;
  initials: string;
  id: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Link href={`/group/${id}`}>
      <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100/50 hover:border-gray-200/70">
        <div className="flex items-center space-x-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg shadow-inner">
            {initials}
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-500 font-medium">
              {role === 'org:admin' ? 'Admin' : 'Member'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

const YourGroups = () => {
  const [groups, setGroups] = useState<Array<Group>>([]);
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const { user } = useUser();

  useEffect(() => {
    if (isLoaded && userMemberships.data) {
      const userGroups = userMemberships.data.map((membership) => {
        const name = membership.organization.name;
        const role = membership.role;
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase();
        return {
          id: membership.organization.id, // Add this line
          name,
          role,
          initials,
        };
      });
      setGroups(userGroups);
    }
  }, [isLoaded, userMemberships.data]);

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto px-6 py-12 sm:px-8 lg:px-12"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">Your Groups</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          View and manage all your groups in one place. You can see the groups
          you&apos;re a part of, your role in each group, and easily access each
          group&apos;s details.
        </p>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <GroupItem {...group} id={group.id} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-center"
      >
        <Link href="/group">
          <Button className="inline-flex items-center px-8 py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
            <Plus className="w-5 h-5 mr-2" />
            Create New Group
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default YourGroups;
