'use client';
import React, { useEffect, useState } from 'react';
import { GroupHeaderSkeleton, MembersSkeleton, BalancesSkeleton, ExpensesSkeleton } from '@/components/group/loading-section';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useOrganizationList, useUser } from '@clerk/nextjs';
import { getBalances, deleteExpense, getExpenses } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for Balance and Expense
interface Balance {
  owes: {
    id: string;
    name: string;
  };
  to: {
    id: string;
    name: string;
  };
  amount: number;
}


interface Expense {
  id: string;
  amount: number;
  description: string;
  created_by: string;
  paid_by: string;
  split_with: {
    id: string;
    name: string;
    splitAmount: number;
  }[];
}

// Add this utility function at the top of the file, outside the component
const formatAmount = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toFixed(2);
};

function GroupPage() {
  const { id } = useParams();
  const { userMemberships, isLoaded: orgLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const org = userMemberships.data?.find(
        (membership) => membership.organization.id === id
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


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function calculateSettlements(dbResponse: any) {
    console.log('dbResponse:', dbResponse); // Log the raw respons
    // json string that dbresponse
    console.log('dbResponse:', JSON.stringify(dbResponse));
    const balances = {}; // Stores net balances for each user

    // Step 1: Compute Net Balances (total_paid - total_owed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbResponse.forEach((user: any) => {
      (balances as { [key: string]: number })[user.user_id] = Number(user.total_paid) - Number(user.total_owed);
    });

    const settlements = [];
    const debtors = [];  // Users who owe money (negative balance)
    const creditors = []; // Users who should receive money (positive balance)

    // Step 2: Split users into debtors & creditors
    for (const user in balances) {
      if ((balances as { [key: string]: number })[user] < 0) debtors.push({ userId: user, amount: -(balances as { [key: string]: number })[user] });  // Convert to positive
      else if ((balances as { [key: string]: number })[user] > 0) creditors.push({ userId: user, amount: (balances as { [key: string]: number })[user] });
    }

    // Step 3: Settle debts
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);

      settlements.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount
      });

      // Reduce amounts
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      // Move to the next debtor/creditor if settled
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    return settlements;
  }

  const fetchBalances = async () => {
    try {
      const transactions = await getBalances(id as string);
      const calculatedSettlements = calculateSettlements(transactions);

      // Fetch members from Clerk API
      const org = userMemberships.data?.find(m => m.organization.id === id)?.organization;
      if (!org) return;

      const memberships = await org.getMemberships();
      const membersMap = new Map(
        memberships.data.map(m => [
          m.publicUserData.userId ?? '',
          `${m.publicUserData.firstName ?? ''} ${m.publicUserData.lastName ?? ''}`.trim(),
        ])
      );

      // Map transactions with member names
      const formattedBalances = calculatedSettlements.map(({ from, to, amount }) => ({
        owes: {
          id: from,
          name: membersMap.get(from) || 'Unknown User',
        },
        to: {
          id: to,
          name: membersMap.get(to) || 'Unknown User',
        },
        amount: Math.abs(amount),
      }));

      setBalances(formattedBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };
  useEffect(() => {
    fetchBalances();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    async function fetchData() {
      if (id && user) {
        const fetchExpenses = async () => {
          try {
            const fetchedExpenses = await getExpenses(id as string); // Fetch raw expenses (IDs only)

            // Fetch members from Clerk API (client-side)
            const org = userMemberships.data?.find(m => m.organization.id === id)?.organization;
            if (!org) return;

            const memberships = await org.getMemberships();
            const membersMap = new Map(
              memberships.data.map(m => [
                m.publicUserData.userId ?? '',
                `${m.publicUserData.firstName ?? ''} ${m.publicUserData.lastName ?? ''}`.trim(),
              ])
            );

            // Replace IDs with names
            const formattedExpenses = fetchedExpenses.map((expense: Expense) => ({
              ...expense,
              paid_by: membersMap.get(expense.paid_by) || "Unknown User", // Replace with actual user dat
              created_by: membersMap.get(expense.created_by) || "Unknown User",
              split_with: expense.split_with.map(participant => ({
                ...participant,
                name: membersMap.get(participant.id) || "Unknown User",
              })),
            }));
            setExpenses(formattedExpenses);
          } catch (error) {
            console.error("Error fetching expenses:", error);
          }
        };
        fetchExpenses();
        setLoading(false);
      }
    }
    if (userLoaded) {
      fetchData();
      if (orgLoaded && userMemberships.data) {
        const orgs = userMemberships.data.map((membership) => ({
          id: membership.organization.id,
          name: membership.organization.name === '' ? 'Demo Users' : membership.organization.name,
        }));

        // Set the first organization as default and fetch its members
        if (orgs.length > 0) {
          // const defaultOrgId = orgs[0].id;
          fetchMembers();
        }
      }

    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, userLoaded]);

  if (!orgLoaded || !userLoaded || loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        <GroupHeaderSkeleton />
        <MembersSkeleton />
        <BalancesSkeleton />
        <ExpensesSkeleton />
      </div>
    );
  }

  const selectedOrganization = userMemberships.data?.find(
    (membership) => membership.organization.id === id
  );

  if (!selectedOrganization) {
    return <div>Organization not found</div>;
  }

  // Update the isAdmin check to match the groups page
  const isAdmin = selectedOrganization?.role === 'org:admin';

  console.log('Selected Organization:', selectedOrganization);
  console.log('Is Admin:', isAdmin);

  const groupDescription =
    "View and manage the details of your group. You can see the group's name, balances, and expenses. As an admin, you can also delete expenses.";

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

  const getConsistentColor = (id: string) => {
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };


  const handleDeleteExpense = async (expenseId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Error 🚨',
        description: 'Only admins can delete expenses. 🚫',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this expense?'
    );
    if (confirmed) {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        router.refresh();
      } else {
        toast({ title: 'Failed to delete expense. Please try again.' });
      }
    }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight break-words">
            {selectedOrganization.organization.name}
          </h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-600 leading-relaxed">{groupDescription}</p>
        </div>
        <Link href="/groups" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] rounded-2xl px-4 sm:px-6 py-2 sm:py-3">
            All Groups
          </Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 sm:mb-8 tracking-tight">Group Members</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 flex items-center space-x-3 sm:space-x-4 transition-all duration-300 hover:shadow-lg border border-gray-100/50 hover:border-gray-200/70"
            >
              <div
                className={`h-10 w-10 sm:h-12 sm:w-12 ${getConsistentColor(member.name)} rounded-2xl flex items-center justify-center text-white font-medium text-base sm:text-lg shadow-inner transition-transform group-hover:scale-105`}
              >
                {getInitials(member.id === user?.id ? 'You' : (member.name === '' ? 'Demo Users' : member.name))}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {member.id === user?.id ? 'You' : (member.name === '' ? 'Demo Users' : member.name)}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 sm:mb-8 tracking-tight">Total Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-purple-900 mb-2">Individual Expenses</h3>
            {members.map((member) => {
              const totalPaid = expenses
                .filter(expense => expense.paid_by === member.name)
                .reduce((sum, expense) => sum + Number(expense.amount), 0);

              console.log(member.name, totalPaid,expenses)

              // const totalOwed = expenses
              //   .flatMap(expense => expense.split_with)
              //   .filter(split => split.id === member.id)
              //   .reduce((sum, split) => sum + Number(split.splitAmount), 0);

              const netBalance = totalPaid ;
              // const netBalance = 100;
              return (
                <div key={member.id} className="flex justify-between items-center py-2">
                  <span className="text-gray-700">
                    {member.id === user?.id ? 'You' : member.name}
                  </span>
                  <span className={`font-medium ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ₹{formatAmount(netBalance)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-green-900 mb-2">Group Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Total Group Expenses</span>
                <span className="font-medium text-green-700">
                  ₹{formatAmount(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 sm:mb-8 tracking-tight">Balances</h2>
        {balances.length > 0 ? (
          <div className="grid gap-3 sm:gap-4">
            {balances.map((balance, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 hover:shadow-lg border border-gray-100/50 hover:border-gray-200/70 space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                  <div
                    className={`h-10 w-10 ${getConsistentColor(balance.owes.name)} rounded-2xl flex items-center justify-center text-white font-medium text-base sm:text-lg shadow-inner transition-transform group-hover:scale-105`}
                  >
                    {getInitials(balance.owes.id === user?.id ? 'You' : balance.owes.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 break-words">
                      {balance.owes.id === user?.id ? 'You' : balance.owes.name}
                      <span className="text-gray-500">
                        {balance.owes.id === user?.id ? ' owe ' : ' owes '}
                      </span>
                      {balance.to.id === user?.id ? 'you' : balance.to.name}
                    </h3>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-semibold text-purple-600 w-full sm:w-auto text-right">
                  ₹ {formatAmount(balance.amount)}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
            <p className="text-base sm:text-lg text-gray-600">
              🌟 No outstanding balances. Everyone's all squared up! 🎉
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 sm:mb-8 tracking-tight">Expenses</h2>
        {expenses.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:shadow-lg border border-gray-100/50 hover:border-gray-200/70"
              >
                <div
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => {
                    const element = document.getElementById(`expense-details-${expense.id}`);
                    if (element) {
                      element.classList.toggle('hidden');
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                      <div
                        className={`h-10 w-10 ${getConsistentColor(expense.description)} rounded-2xl flex items-center justify-center text-white font-medium text-base sm:text-lg shadow-inner transition-transform group-hover:scale-105`}
                      >
                        {getInitials(expense.description)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 break-words">{expense.description}</h3>
                        <p className="text-purple-600 font-semibold text-base sm:text-lg mt-1">
                          ₹{formatAmount(expense.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto">
                      <p className="text-sm text-gray-600">
                        Paid by {expense.paid_by === user?.id ? 'You' : expense.paid_by}
                      </p>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div id={`expense-details-${expense.id}`} className="hidden border-t border-gray-200">
                  <div className="p-3 sm:p-4 space-y-2">
                    {expense.split_with.map((participant, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 px-3 sm:px-4 hover:bg-gray-100 rounded-lg transition-colors">
                        <span className="text-gray-700 break-words">
                          {participant.id === user?.id ? 'You' : participant.name}
                        </span>
                        <span className="font-medium text-purple-600 ml-4">
                          ₹{formatAmount(participant.splitAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
            <p className="text-base sm:text-lg text-gray-600">
              💸 No expenses yet. Time to split some bills! 🧾
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default GroupPage;
