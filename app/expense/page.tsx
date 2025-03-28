'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';
import { addExpense } from '../actions';

interface Organization {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
}

interface SplitMember {
  id: string;
  name: string;
  amountPaid?: number;
  amountOwed?: number;
  percentage?: number;
  shares?: number;
}

export default function AddExpense() {
  const router = useRouter();
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [splitWith, setSplitWith] = useState<SplitMember[]>([]);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [remainingPercentage, setRemainingPercentage] = useState<number>(100);
  const [remainingShares, setRemainingShares] = useState<number>(0);

  const { user, isLoaded: isUserLoaded } = useUser();
  const { userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: true,
  });
  const { isLoaded: isOrgLoaded } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (isOrgListLoaded && userMemberships.data) {
      const orgs = userMemberships.data.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
      }));
      setOrganizations(orgs);

      if (orgs.length > 0 && !group) {
        const defaultOrgId = orgs[0].id;
        setGroup(defaultOrgId);
        fetchMembers(defaultOrgId);
      }
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrgListLoaded, userMemberships.data, group]);

  useEffect(() => {
    if (amount && splitWith.length > 0) {
      const totalAmount = parseFloat(amount);
      if (splitType === 'equal') {
        const perPerson = totalAmount / splitWith.length;
        setRemainingAmount(perPerson);
      } else if (splitType === 'exact') {
        const allocatedAmount = splitWith.reduce((sum, user) => sum + (user.amountOwed || 0), 0);
        setRemainingAmount(totalAmount - allocatedAmount);
      } else if (splitType === 'percentage') {
        const allocatedPercentage = splitWith.reduce((sum, user) => sum + (user.percentage || 0), 0);
        setRemainingPercentage(100 - allocatedPercentage);
      } else if (splitType === 'shares') {
        const totalShares = splitWith.reduce((sum, user) => sum + (user.shares || 0), 0);
        setRemainingShares(totalShares);
      }
    }
  }, [amount, splitWith, splitType]);

  const fetchMembers = async (orgId: string) => {
    try {
      const org = userMemberships.data?.find(
        (membership) => membership.organization.id === orgId
      )?.organization;
      
      if (org) {
        const memberships = await org.getMemberships();
        const membersList = memberships.data.map((membership) => ({
          id: membership.publicUserData.userId ?? '',
          name: `${membership.publicUserData.firstName ?? ''} ${
            membership.publicUserData.lastName ?? ''
          }`.trim(),
        }));
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch group members. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGroupChange = (orgId: string) => {
    setGroup(orgId);
    fetchMembers(orgId);
    setSplitWith([]);
  };

  const toggleUserSelection = (user: Member) => {
    setSplitWith((prev) => {
      if (prev.find((p) => p.id === user.id)) {
        return prev.filter((p) => p.id !== user.id);
      }
      return [...prev, { ...user, amountOwed: 0 }];
    });
  };

  const handleSplitChange = (index: number, field: keyof SplitMember, value: number) => {
    setSplitWith((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'shares') {
        const totalShares = updated.reduce((sum, user) => sum + (user.shares || 0), 0);
        setRemainingShares(totalShares);

        if (amount && totalShares > 0) {
          const totalAmount = parseFloat(amount);
          const amountPerShare = totalAmount / totalShares;
          
          return updated.map(user => ({
            ...user,
            amountOwed: user.id === paidBy ? 
              -(totalAmount - ((user.shares || 0) * amountPerShare)) :
              (user.shares || 0) * amountPerShare
          }));
        }
      } else if (field === 'percentage') {
        const totalPercentage = updated.reduce((sum, user) => sum + (user.percentage || 0), 0);
        setRemainingPercentage(100 - totalPercentage);
      } else if (field === 'amountOwed') {
        const totalExact = updated.reduce((sum, user) => sum + (user.amountOwed || 0), 0);
        setRemainingAmount(parseFloat(amount) - totalExact);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isUserLoaded || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add an expense.',
        variant: 'destructive',
      });
      return;
    }

    if (!paidBy || splitWith.length === 0 || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill in all required fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    const totalAmount = parseFloat(amount);
    let updatedSplitWith = splitWith;

    switch (splitType) {
      case 'equal': {
        const perPerson = totalAmount / splitWith.length;
        updatedSplitWith = splitWith.map(user => ({
          ...user,
          amountOwed: perPerson,
          amountPaid: user.id === paidBy ? totalAmount : 0,
        }));
        break;
      }
      case 'exact': {
        const totalSplit = splitWith.reduce((sum, user) => sum + (user.amountOwed || 0), 0);
        if (Math.abs(totalSplit - totalAmount) > 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'The sum of split amounts must equal the total amount.',
            variant: 'destructive',
          });
          return;
        }
        updatedSplitWith = splitWith.map(user => ({
          ...user,
          amountPaid: user.id === paidBy ? totalAmount : 0,
        }));
        break;
      }
      case 'percentage': {
        if (Math.abs(remainingPercentage) > 0.01) {
          toast({
            title: 'Invalid Split',
            description: 'The sum of percentages must equal 100%.',
            variant: 'destructive',
          });
          return;
        }
        updatedSplitWith = splitWith.map(user => ({
          ...user,
          amountOwed: totalAmount * (user.percentage || 0) / 100,
          amountPaid: user.id === paidBy ? totalAmount : 0,
        }));
        break;
      }
      case 'shares': {
        if (remainingShares <= 0) {
          toast({
            title: 'Invalid Split',
            description: 'Total shares must be greater than 0.',
            variant: 'destructive',
          });
          return;
        }
        updatedSplitWith = splitWith.map(user => ({
          ...user,
          amountOwed: totalAmount * (user.shares || 0) / remainingShares,
          amountPaid: user.id === paidBy ? totalAmount : 0,
        }));
        break;
      }
    }

    try {
      const result = await addExpense({
        amount: totalAmount,
        description,
        groupId: group,
        splitType: splitType as 'equal' | 'exact' | 'percentage' | 'shares',
        splitWith: updatedSplitWith,
        createdBy: user.id,
        paidBy
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Expense added successfully!',
        });
        router.push(`/group/${group}`);
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isUserLoaded || !isOrgListLoaded || !isOrgLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl bg-white min-h-screen"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto space-y-12"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-semibold tracking-tight text-gray-900 mb-4"
          >
            Add an expense
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-500 leading-relaxed"
          >
            Record your expenses and split them with your group.
          </motion.p>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-medium text-gray-700">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="₹ 0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1 w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                placeholder="What did you pay for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1 w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label htmlFor="group" className="text-base font-medium text-gray-700">
                Group
              </Label>
              {organizations.length > 0 ? (
                <Select onValueChange={handleGroupChange} value={group} required>
                  <SelectTrigger id="group" className="mt-1 w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} className="text-lg py-3">
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-2 text-base text-gray-500 bg-gray-50 p-4 rounded-xl">
                  No groups available. Please create or join a group first.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="paidBy" className="text-base font-medium text-gray-700">
                Paid by
              </Label>
              <select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                required
                className="mt-1 w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl"
              >
                <option value="">Select who paid</option>
                {members.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="splitType" className="text-base font-medium text-gray-700">
                Split type
              </Label>
              <select
                id="splitType"
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                required
                className="mt-1 w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl"
              >
                <option value="equal">Split Equally</option>
                <option value="exact">Split by Exact Amount</option>
                <option value="percentage">Split by Percentage</option>
                <option value="shares">Split by Shares</option>
              </select>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label className="text-base font-medium text-gray-700">Split with</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((user) => (
                  <div
                    key={user.id}
                    className="group flex items-center p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={splitWith.some((p) => p.id === user.id)}
                      onChange={() => toggleUserSelection(user)}
                      className="h-5 w-5 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                    />
                    <span className="ml-4 text-base text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {splitType !== 'equal' && (
              <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium text-gray-700">
                    {splitType === 'percentage' ? 'Percentage Split' :
                     splitType === 'shares' ? 'Shares Split' : 'Exact Amount Split'}
                  </Label>
                  <div className="text-base text-gray-600 font-medium">
                    {splitType === 'exact' && (
                      <span>Remaining: ₹{remainingAmount.toFixed(2)}</span>
                    )}
                    {splitType === 'percentage' && (
                      <span>Remaining: {remainingPercentage.toFixed(1)}%</span>
                    )}
                    {splitType === 'shares' && (
                      <span>Total Shares: {remainingShares}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {splitWith.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-6 p-4 bg-white border border-gray-200 rounded-xl">
                      <span className="w-1/3 text-base text-gray-700">{user.name}</span>
                      <div className="w-2/3">
                        <Input
                          type="number"
                          placeholder={splitType === 'percentage' ? 'Percentage' : 
                                     splitType === 'shares' ? 'Shares' : 'Amount'}
                          value={
                            splitType === 'percentage' ? user.percentage || 0 :
                            splitType === 'shares' ? user.shares || 0 :
                            user.amountOwed || 0
                          }
                          onChange={(e) => {
                            const field = splitType === 'percentage' ? 'percentage' :
                                        splitType === 'shares' ? 'shares' : 'amountOwed';
                            handleSplitChange(index, field, Number(e.target.value));
                          }}
                          className="w-full h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900 border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <Button 
            type="submit"
            className="w-full h-14 text-lg font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            Save Expense
          </Button>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
