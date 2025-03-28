CREATE TABLE expenses (
  expense_id UUID PRIMARY KEY,
  group_id TEXT,         -- Reference to Clerk's group ID
  created_by TEXT,       -- Clerk user ID who created the expense
  description VARCHAR(255) NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_by TEXT,          -- Clerk user ID who paid the expense
  split_type VARCHAR(20) NOT NULL,  -- 'equal', 'exact', 'percentage', 'shares'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expense_participants (
  participant_id UUID PRIMARY KEY,
  expense_id UUID REFERENCES expenses(expense_id),
  user_id TEXT,  -- Clerk user ID
  amount_paid NUMERIC DEFAULT 0,
  amount_owed NUMERIC DEFAULT 0
);

CREATE TABLE settlements (
  settlement_id UUID PRIMARY KEY,
  group_id TEXT,       -- Clerk group ID
  from_user TEXT,      -- Clerk user ID (payer)
  to_user TEXT,        -- Clerk user ID (receiver)
  amount NUMERIC,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  transaction_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
