'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationList, useUser } from '@clerk/nextjs';
import { PlusCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { createOrganization } = useOrganizationList();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a group',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!createOrganization) {
        throw new Error('createOrganization function is undefined');
      }
      const organization = await createOrganization({ name: groupName });

      // Invite members
      for (const email of invitedMembers) {
        await organization.inviteMember({
          emailAddress: email,
          role: 'org:member',
        });
      }

      toast({
        title: 'Success',
        description: 'Group created successfully!',
      });

      // Redirect to the new group page
      router.push(`/group/${organization.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create group. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = () => {
    if (inviteEmail && !invitedMembers.includes(inviteEmail)) {
      setInvitedMembers([...invitedMembers, inviteEmail]);
      setInviteEmail('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-3xl"
    >
      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-3 text-gray-900 tracking-tight"
      >
        Create a group
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-gray-500 mb-12 leading-relaxed"
      >
        Split expenses with friends, roommates, and more.
      </motion.p>

      <motion.form 
        onSubmit={handleCreateGroup} 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label
            htmlFor="groupName"
            className="block text-sm font-semibold tracking-wide text-gray-700"
          >
            Group name
          </label>
          <Input
            id="groupName"
            name="groupName"
            type="text"
            placeholder="Enter group name"
            className="w-full text-base py-5 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition-all duration-200 placeholder:text-gray-400"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label
            htmlFor="inviteEmail"
            className="block text-sm font-semibold tracking-wide text-gray-700"
          >
            Invite members
          </label>
          <div className="flex space-x-3 mt-3">
            <Input
              id="inviteEmail"
              name="inviteEmail"
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-grow text-base py-5 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition-all duration-200 placeholder:text-gray-400"
            />
            <Button 
              type="button" 
              onClick={handleInvite} 
              disabled={isLoading}
              className="px-6 py-5 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Invite
            </Button>
          </div>
        </motion.div>

        {invitedMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 rounded-xl p-6"
          >
            <h3 className="text-sm font-semibold tracking-wide text-gray-700 mb-4">
              Invited members
            </h3>
            <ul className="space-y-3">
              {invitedMembers.map((email, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-gray-600 flex items-center space-x-3 py-2 px-4 bg-white rounded-xl shadow-sm"
                >
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm">{email}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button 
            className="w-full py-5 text-base font-medium rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
