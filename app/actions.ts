'use server';

import { neon } from '@neondatabase/serverless';

// connection for NeonDB
const sql = neon(process.env.DATABASE_URL!);



interface SettlementData {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  transactionId: string;
}
interface SplitMember {
  id: string;
  name: string;
  amountPaid?: number;
  amountOwed?: number;
  percentage?: number;
  shares?: number;
}

interface ParticipantBalance {
  user_id: string;
  total_paid: number;
  total_owed: number;
}

export async function addExpense(expenseData: {
  description: string;
  groupId: string;
  splitType?: 'equal' | 'exact' | 'percentage' | 'shares';
  splitWith: Array<SplitMember>;
  createdBy: string;
  paidBy: string;
  amount: string | number;
}) {
  const { description, groupId, splitType = 'equal', splitWith, createdBy ,paidBy} = expenseData;
  const amount = Number(expenseData.amount);
  const expenseId = crypto.randomUUID();

  // Validate required fields
  if (!groupId) throw new Error('Group ID is required');
  if (!createdBy) throw new Error('Creator ID is required');
  if (!description?.trim()) throw new Error('Description is required');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be a positive number');

  // Validate split type
  const validSplitTypes = ['equal', 'exact', 'percentage', 'shares'];
  if (!validSplitTypes.includes(splitType)) {
    throw new Error(`Invalid split type. Must be one of: ${validSplitTypes.join(', ')}`);
  }

  // Validate split participants
  if (!Array.isArray(splitWith) || splitWith.length === 0) {
    throw new Error('Split participants must be a non-empty array');
  }
  if (!splitWith.some(p => p.id === createdBy)) {
    throw new Error('Creator must be included in split participants');
  }

  try {
    // Insert expense
    await sql`
      INSERT INTO expenses (expense_id, total_amount, description, group_id, split_type, created_by, paid_by, created_at)
      VALUES (${expenseId}, ${amount}, ${description}, ${groupId}, ${splitType}, ${createdBy}, ${paidBy}, NOW())
    `;
    for (const participant of splitWith) {
      const { id, amountPaid, amountOwed} = participant;
        await sql`
        INSERT INTO expense_participants (participant_id, expense_id, user_id, amount_paid, amount_owed)
        VALUES (${crypto.randomUUID()}, ${expenseId}, ${id}, ${amountPaid}, ${amountOwed})
      `;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add expense');
  }
}




export async function getBalances(groupId: string) {
  try {
    const transactions = await simplifyDebts(groupId);

     return transactions
  } catch (error) {
    console.error('Error fetching group balances:', error);
    return [];
  }
}

export async function simplifyDebts(groupId: string): Promise<ParticipantBalance[]> {

  const participants = await sql`
  SELECT 
    user_id, 
    SUM(amount_paid) AS total_paid,
    SUM(amount_owed) AS total_owed
  FROM expense_participants
  WHERE expense_id IN (
    SELECT expense_id FROM expenses 
    WHERE group_id = ${groupId}
  )
  GROUP BY user_id
`;
  return participants as ParticipantBalance[];
}


export async function addSettlement(settlementData: SettlementData) {
  const { groupId, fromUser, toUser, amount, transactionId } = settlementData;
  try {
    await sql`
      INSERT INTO settlements (group_id, from_user, to_user, amount, transaction_id, status)
      VALUES (${groupId}, ${fromUser}, ${toUser}, ${amount}, ${transactionId}, 'pending')
    `;
    return { success: true };
  } catch (error) {
    console.error('Error adding settlement:', error);
    return { success: false };
  }
}

export async function updateSettlementStatus(transactionId: string, status: string) {
  try {
    await sql`
      UPDATE settlements
      SET status = ${status}
      WHERE transaction_id = ${transactionId}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error updating settlement status:', error);
    return { success: false };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    await sql`
      DELETE FROM expense_participants
      WHERE expense_id = ${expenseId}
    `;

    await sql`
      DELETE FROM expenses
      WHERE expense_id = ${expenseId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false };
  }
}

export async function getExpenses(groupId: string) {
  try {
    const expenses = await sql`
      SELECT e.expense_id AS id, e.description, e.total_amount AS amount, e.created_by,e.paid_by,
             ep.user_id, ep.amount_owed
      FROM expenses e
      JOIN expense_participants ep ON e.expense_id = ep.expense_id
      WHERE e.group_id = ${groupId}
      ORDER BY e.created_at DESC
    `;

    // Group expenses by ID
    const formattedExpenses = expenses.reduce((acc, row) => {
      let expense = acc.find((exp: { id: string }) => exp.id === row.id);
      if (!expense) {
        expense = {
          id: row.id,
          amount: row.amount,
          description: row.description,
          created_by: row.created_by,
          paid_by: row.paid_by,
          split_with: [],
        };
        acc.push(expense);
      }

      expense.split_with.push({
        id: row.user_id,
        name: "", // Placeholder for now (will fetch in client)
        splitAmount: row.amount_owed,
      });

      return acc;
    }, []);

    return formattedExpenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}



