# JSW WorkFlow Pro Database Schema & Architecture

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    DEPARTMENTS ||--o{ USERS : "has"
    DEPARTMENTS ||--o{ TASKS : "owns"
    DEPARTMENTS ||--o| CHAT_ROOMS : "has channel"

    USERS ||--o{ TASKS : "creates (as Employee)"
    USERS ||--o{ TASKS : "assigned to (as Worker)"
    USERS ||--o{ REPORTS : "submits"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ACTIVITY_LOGS : "performs"

    TASKS ||--o{ REPORTS : "has"
    TASKS ||--o| CHAT_ROOMS : "has channel"

    REPORTS ||--o{ ATTACHMENTS : "contains"
    
    CHAT_ROOMS ||--o{ MESSAGES : "contains"
    MESSAGES ||--o{ ATTACHMENTS : "contains"

    USERS {
        uuid id PK
        string employee_id UK
        string email UK
        string full_name
        enum role "ADMIN, EMPLOYEE, WORKER"
        uuid department_id FK
    }

    DEPARTMENTS {
        uuid id PK
        string name
        string description
    }

    TASKS {
        uuid id PK
        string title
        text description
        uuid department_id FK
        uuid creator_id FK
        uuid assignee_id FK
        enum priority
        enum status
        timestamp due_date
    }

    REPORTS {
        uuid id PK
        uuid task_id FK
        uuid submitter_id FK
        text text_content
        text ai_formatted_content
        numeric latitude
        numeric longitude
        enum status
    }

    CHAT_ROOMS {
        uuid id PK
        enum room_type "DEPARTMENT, TASK"
        uuid department_id FK
        uuid task_id FK
    }

    MESSAGES {
        uuid id PK
        uuid room_id FK
        uuid sender_id FK
        text content
    }

    ATTACHMENTS {
        uuid id PK
        uuid report_id FK
        uuid message_id FK
        string file_url
        string file_type
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        jsonb metadata
    }
```

## 2. Table Modules

1. **Users & Departments**: Core organizational structure. Tied to `auth.users` securely via the `id` matching the Supabase Auth UUID.
2. **Tasks & Reports**: Core operational logic. Reports can contain AI-generated content (from Gemini).
3. **Chat Rooms & Messages**: A unified chat architecture. A `chat_rooms` table abstracts whether a conversation belongs to a Department or a specific Task, simplifying message routing and RLS.
4. **Attachments**: Centralized blob storage metadata, allowing images/voice notes to attach to Reports or Chat Messages.
5. **Activity Logs & Notifications**: Observability and asynchronous alerting.

## 3. RLS Concepts

- **Admin Policy**: `TRUE` across the board generally, or explicitly defined to allow full CRUD.
- **Employee Policy**: 
  - `Tasks`: Select/Insert/Update where `task.department_id = auth_user.department_id`.
  - `Users`: Can view peers in the same department.
- **Worker Policy**:
  - `Tasks`: Select/Update where `task.assignee_id = auth.uid()`.
  - `Reports`: Insert where they are the assignee of the task. Read their own.
