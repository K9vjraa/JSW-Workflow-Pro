-- JSW WorkFlow Pro Database Schema (Production Ready)

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS & CUSTOM TYPES
-- ==============================================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE', 'WORKER');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE task_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'REJECTED');
CREATE TYPE report_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE file_category AS ENUM ('IMAGE', 'VIDEO', 'VOICE', 'DOCUMENT');
CREATE TYPE room_type AS ENUM ('DEPARTMENT', 'TASK');

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (Maps to auth.users in Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Must match auth.users.id
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'WORKER',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    status task_status NOT NULL DEFAULT 'PLANNED',
    category VARCHAR(50) DEFAULT 'PLANNED',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_due_date CHECK (due_date >= created_at)
);

-- REPORTS (Field Executions)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    text_content TEXT,
    ai_formatted_content TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status report_status DEFAULT 'PENDING',
    supervisor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT ROOMS
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type room_type NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT exclusive_room_type CHECK (
        (type = 'DEPARTMENT' AND department_id IS NOT NULL AND task_id IS NULL) OR
        (type = 'TASK' AND task_id IS NOT NULL AND department_id IS NULL)
    )
);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGE READS
CREATE TABLE message_reads (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- MESSAGE MENTIONS
CREATE TABLE message_mentions (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id)
);

-- ATTACHMENTS
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type file_category NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT exclusive_attachment CHECK (
        (report_id IS NOT NULL AND message_id IS NULL) OR
        (message_id IS NOT NULL AND report_id IS NULL)
    )
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'TASK_ASSIGNED', 'REPORT_APPROVED'
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOGS (Audit)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'USER_CREATED', 'TASK_STATUS_CHANGED'
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'TASK', 'REPORT'
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_reports_task ON reports(task_id);
CREATE INDEX idx_reports_submitter ON reports(submitter_id);

CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

CREATE INDEX idx_chat_rooms_department ON chat_rooms(department_id);
CREATE INDEX idx_chat_rooms_task ON chat_rooms(task_id);


-- ==============================================================================
-- 4. TRIGGERS FOR AUTO-UPDATING `updated_at`
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_modtime BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4.5 NOTIFICATION TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (NEW.assignee_id, 'New Task Assigned', 'You have been assigned to task: ' || NEW.title, 'TASK_ASSIGNED', '/worker/tasks');
    ELSIF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
        INSERT INTO notifications (user_id, title, message, type, action_url)
        VALUES (NEW.assignee_id, 'New Task Assigned', 'You have been assigned to task: ' || NEW.title, 'TASK_ASSIGNED', '/worker/tasks');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_assignment_notification 
AFTER INSERT OR UPDATE ON tasks 
FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();

CREATE OR REPLACE FUNCTION notify_report_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'PENDING' AND NEW.status != 'PENDING' THEN
        -- Notify the worker who submitted the report
        INSERT INTO notifications (user_id, title, message, type, action_url)
        SELECT u.id, 'Report ' || NEW.status, 'Your report for a task was ' || NEW.status, 'REPORT_STATUS', '/worker/reports'
        FROM users u WHERE u.id = NEW.worker_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER report_status_notification 
AFTER UPDATE ON reports 
FOR EACH ROW EXECUTE FUNCTION notify_report_status();

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    r_type VARCHAR;
    dept_id UUID;
    t_id UUID;
    sender_name VARCHAR;
BEGIN
    SELECT type, department_id, task_id INTO r_type, dept_id, t_id FROM chat_rooms WHERE id = NEW.room_id;
    SELECT full_name INTO sender_name FROM users WHERE id = NEW.sender_id;
    
    IF r_type = 'DEPARTMENT' THEN
         -- Notify department members except sender
         INSERT INTO notifications (user_id, title, message, type, action_url)
         SELECT u.id, 'New Message in Department', sender_name || ' sent a message.', 'NEW_MESSAGE', '/chat'
         FROM users u WHERE u.department_id = dept_id AND u.id != NEW.sender_id;
    ELSIF r_type = 'TASK' THEN
         -- Notify assignee and supervisor (admin) OR anyone involved
         -- We'll just notify assignee if sender is admin/employee, and admins if sender is assignee
         INSERT INTO notifications (user_id, title, message, type, action_url)
         SELECT u.id, 'New Message in Task', sender_name || ' commented on a task.', 'NEW_MESSAGE', '/chat'
         FROM users u
         WHERE u.id != NEW.sender_id AND (
             u.id = (SELECT assignee_id FROM tasks WHERE id = t_id) OR
             u.id IN (SELECT id FROM users WHERE role IN ('ADMIN', 'EMPLOYEE') AND department_id = (SELECT department_id FROM tasks WHERE id = t_id))
         );
    END IF;
    
    -- basic mention extraction @FirstName
    -- a more complex query could regex through NEW.content to find @Name
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER new_message_notification 
AFTER INSERT ON messages 
FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper Function for RLS
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_auth_department() RETURNS UUID AS $$
  SELECT department_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Users Table Policies
CREATE POLICY "Admins have full access to users" ON users FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Users can view members of their own department" ON users FOR SELECT USING (department_id = get_auth_department());
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Departments Table Policies
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (get_auth_role() = 'ADMIN');

-- Tasks Table Policies
CREATE POLICY "Admins have full access to tasks" ON tasks FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Employees can manage tasks in their department" ON tasks FOR ALL USING (
    get_auth_role() = 'EMPLOYEE' AND department_id = get_auth_department()
);
CREATE POLICY "Workers can view assigned tasks" ON tasks FOR SELECT USING (
    assignee_id = auth.uid() OR department_id = get_auth_department()
);
CREATE POLICY "Workers can update status of assigned tasks" ON tasks FOR UPDATE USING (
    assignee_id = auth.uid()
) WITH CHECK (
    -- Prevent workers from changing reassignment or department
    assignee_id = auth.uid() 
);

-- Reports Table Policies
CREATE POLICY "Admins have full access to reports" ON reports FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Employees can view and update reports in their department" ON reports FOR ALL USING (
    get_auth_role() = 'EMPLOYEE' AND 
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = reports.task_id AND tasks.department_id = get_auth_department())
);
CREATE POLICY "Workers can insert/manage their own reports" ON reports FOR ALL USING (
    submitter_id = auth.uid()
);

-- Chat Rooms Policies
CREATE POLICY "Users can view rooms for their department or assigned tasks" ON chat_rooms FOR SELECT USING (
    get_auth_role() = 'ADMIN' OR
    (type = 'DEPARTMENT' AND department_id = get_auth_department()) OR
    (type = 'TASK' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = chat_rooms.task_id AND (tasks.department_id = get_auth_department() OR tasks.assignee_id = auth.uid())))
);

CREATE POLICY "Users can create chat rooms for their department or tasks" ON chat_rooms FOR INSERT WITH CHECK (
    get_auth_role() = 'ADMIN' OR
    (type = 'DEPARTMENT' AND department_id = get_auth_department()) OR
    (type = 'TASK' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = chat_rooms.task_id AND tasks.department_id = get_auth_department()))
);

-- Messages Policies
CREATE POLICY "Users can view messages in their visible rooms" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM chat_rooms WHERE chat_rooms.id = messages.room_id AND (
            get_auth_role() = 'ADMIN' OR
            (chat_rooms.type = 'DEPARTMENT' AND chat_rooms.department_id = get_auth_department()) OR
            (chat_rooms.type = 'TASK' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = chat_rooms.task_id AND (tasks.department_id = get_auth_department() OR tasks.assignee_id = auth.uid())))
        )
    )
);
CREATE POLICY "Users can insert messages into their visible rooms" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM chat_rooms WHERE chat_rooms.id = messages.room_id AND (
            get_auth_role() = 'ADMIN' OR
            (chat_rooms.type = 'DEPARTMENT' AND chat_rooms.department_id = get_auth_department()) OR
            (chat_rooms.type = 'TASK' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = chat_rooms.task_id AND (tasks.department_id = get_auth_department() OR tasks.assignee_id = auth.uid())))
        )
    )
);

-- Message Reads Policies
CREATE POLICY "Users can view reads in their visible rooms" ON message_reads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM messages JOIN chat_rooms ON messages.room_id = chat_rooms.id WHERE messages.id = message_reads.message_id AND (
            get_auth_role() = 'ADMIN' OR
            (chat_rooms.type = 'DEPARTMENT' AND chat_rooms.department_id = get_auth_department()) OR
            (chat_rooms.type = 'TASK' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = chat_rooms.task_id AND (tasks.department_id = get_auth_department() OR tasks.assignee_id = auth.uid())))
        )
    )
);
CREATE POLICY "Users can insert their own reads" ON message_reads FOR INSERT WITH CHECK (
    user_id = auth.uid()
);
CREATE POLICY "Users can update their own reads" ON message_reads FOR UPDATE USING (
    user_id = auth.uid()
);

-- Notifications Policies
CREATE POLICY "Users control their own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- ==============================================================================
-- 6. ANALYTICS FUNCTIONS (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    task_stats JSONB;
    dept_stats JSONB;
    productivity JSONB;
    monthly_trends JSONB;
    pending_approvals INT;
BEGIN
    -- Only ADMIN can run this
    IF get_auth_role() != 'ADMIN' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Task Completion Rate
    SELECT json_build_object(
        'total', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE status = 'COMPLETED'),
        'in_progress', COUNT(*) FILTER (WHERE status = 'IN_PROGRESS'),
        'pending_approval', COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')
    ) INTO task_stats FROM tasks;

    -- Department Performance
    SELECT json_agg(json_build_object(
        'name', d.name,
        'completed', COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED'),
        'total', COUNT(t.id)
    )) INTO dept_stats
    FROM departments d
    LEFT JOIN tasks t ON d.id = t.department_id
    GROUP BY d.id, d.name;

    -- Worker Productivity (Top 5 workers)
    SELECT json_agg(json_build_object(
        'name', u.full_name,
        'completed_tasks', COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')
    )) INTO productivity
    FROM users u
    JOIN tasks t ON u.id = t.assignee_id
    WHERE u.role = 'WORKER'
    GROUP BY u.id, u.full_name
    ORDER BY COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') DESC
    LIMIT 5;

    -- Monthly Trends (Last 6 months)
    SELECT json_agg(json_build_object(
        'month', TO_CHAR(date_trunc('month', d), 'Mon'),
        'completed', (
            SELECT COUNT(*) FROM tasks 
            WHERE status = 'COMPLETED' 
            AND date_trunc('month', completed_at) = date_trunc('month', d)
        )
    )) INTO monthly_trends
    FROM generate_series(
        date_trunc('month', current_date - interval '5 months'),
        date_trunc('month', current_date),
        '1 month'
    ) AS d;

    -- Pending Approvals
    SELECT COUNT(*) INTO pending_approvals FROM reports WHERE status = 'PENDING';

    result = jsonb_build_object(
        'taskStats', task_stats,
        'departmentPerformance', dept_stats,
        'workerProductivity', productivity,
        'monthlyTrends', monthly_trends,
        'pendingApprovals', pending_approvals
    );

    RETURN result;
END;
$$;
