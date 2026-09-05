-- SANAD Database Migration 004: To-dos
-- Personal productivity module.

-- ===========================================
-- 1. To-dos
-- ===========================================
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  due_date DATE,
  due_time TIME,
  
  -- Priority
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Status
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_todos_user ON todos(user_id);
CREATE INDEX idx_todos_due ON todos(user_id, due_date);
CREATE INDEX idx_todos_priority ON todos(user_id, priority);
CREATE INDEX idx_todos_done ON todos(user_id, is_done);

-- ===========================================
-- 2. Trigger for updated_at
-- ===========================================
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. RLS Policies
-- ===========================================

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Todos: owner-only access
CREATE POLICY todos_read ON todos
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

CREATE POLICY todos_write ON todos
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_system_admin = TRUE
    )
  );

-- ===========================================
-- 4. View for todo summaries
-- ===========================================
CREATE OR REPLACE VIEW todo_summary_view AS
SELECT 
  t.id,
  t.user_id,
  t.title,
  t.due_date,
  t.due_time,
  t.priority,
  t.is_done,
  t.created_at,
  CASE 
    WHEN t.due_date < CURRENT_DATE AND NOT t.is_done THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE AND NOT t.is_done THEN 'due_today'
    WHEN t.due_date > CURRENT_DATE AND NOT t.is_done THEN 'upcoming'
    ELSE 'done'
  END as status
FROM todos t
WHERE t.is_done = FALSE OR t.due_date >= CURRENT_DATE - INTERVAL '7 days';
