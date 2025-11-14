# Tasks Management System - Implementation Plan

## Overview
This document outlines the implementation plan for a comprehensive Tasks Management system with Kanban board support, task assignments, sub-tasks, and project integration.

## Features

### 1. Task Board & Workflow
- **Visual Kanban Board** with stages: `Backlog` → `In Progress` → `Review` → `Done`
- **Alternative Status Values** (from images): `New`, `Todo`, `On Going`, `In Review`, `Completed`
- **Drag-and-drop** task management for easy status updates
- **List View** for tabular task display
- **Task Details View** with comprehensive information

### 2. Task Assignment
- Assign tasks to **individuals** (single user)
- Assign tasks to **groups** (multiple users)
- **Assigned By** tracking (who assigned the task)
- **Assigned Date** tracking
- **Due Date** with deadline management

### 3. Task Priority & Status
- **Priority Levels**: `Low`, `Medium`, `High`, `Critical`
- **Status Stages**: `New` (Backlog), `Todo`, `On Going` (In Progress), `In Review`, `Completed` (Done)
- Color-coded status and priority indicators

### 4. Sub-tasks Support
- Break larger tasks into smaller **milestones**
- Sub-tasks with checkboxes
- Track completion status of sub-tasks
- Calculate parent task progress based on sub-task completion

### 5. Project Integration
- Tasks **must be connected** to a particular project
- Each task belongs to one project
- Filter tasks by project
- Display project information in task details

### 6. Task Details & Metadata
- **Task ID**: Auto-generated unique identifier (e.g., SPK-123)
- **Title**: Task name
- **Description**: Rich text description
- **Tags**: Multiple tags for categorization (e.g., UI/UX, Development, Marketing)
- **Progress**: Percentage completion (0-100%)
- **Efforts**: Time tracking (hours, minutes, seconds)
- **Created Date**: When task was created
- **Assigned Date**: When task was assigned
- **Due Date**: Task deadline

### 7. Task Discussions/Comments
- **Comment system** for task discussions
- **Activity feed** showing:
  - Comments
  - Reactions (likes)
  - Document shares
  - Status changes
  - Assignment changes
- **Timestamps** for all activities
- **User mentions** in comments

### 8. Task Attachments
- **File attachments** support
- Multiple files per task
- File metadata: name, size, type, upload date
- S3 integration for file storage (following existing pattern)

### 9. Task Statistics & Analytics
- **Task counts** by status (New, Completed, Pending, Inprogress)
- **Monthly statistics** with percentage changes
- **Historical data** (last 6 months)
- **Charts and graphs** for visualization

## Data Models

### Task Model (`task.model.js`)

```javascript
{
  // Basic Information
  taskId: String,              // Auto-generated: SPK-{number}
  title: String,               // Required
  description: String,         // Rich text/HTML
  project: ObjectId,           // Required - Reference to Project
  status: String,              // Enum: 'New', 'Todo', 'On Going', 'In Review', 'Completed'
  priority: String,            // Enum: 'Low', 'Medium', 'High', 'Critical'
  
  // Dates
  assignedDate: Date,
  dueDate: Date,
  
  // Assignment
  assignedBy: ObjectId,        // Reference to User (who assigned)
  assignedTo: [ObjectId],      // Array of User IDs (can be single or multiple)
  
  // Progress Tracking
  progress: Number,           // 0-100 percentage
  efforts: {                  // Time tracking
    hours: Number,
    minutes: Number,
    seconds: Number
  },
  
  // Metadata
  tags: [String],             // Array of tag strings
  taskKey: String,            // For task ID generation (e.g., 'SPK')
  
  // Sub-tasks
  subTasks: [{
    title: String,            // Required
    description: String,
    isCompleted: Boolean,     // Default: false
    completedAt: Date,
    completedBy: ObjectId,    // Reference to User
    order: Number,            // For ordering
    _id: true
  }],
  
  // Attachments
  attachments: [{
    label: String,
    url: String,
    key: String,              // S3 file key
    originalName: String,
    size: Number,             // File size in bytes
    mimeType: String,
    uploadedBy: ObjectId,     // Reference to User
    uploadedAt: Date,
    _id: true
  }],
  
  // Ownership
  createdBy: ObjectId,        // Required - Reference to User
  updatedBy: ObjectId,        // Reference to User
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Task Comment Model (`taskComment.model.js`)

```javascript
{
  task: ObjectId,             // Required - Reference to Task
  user: ObjectId,             // Required - Reference to User
  content: String,            // Required - Comment text
  type: String,               // Enum: 'comment', 'reaction', 'status_change', 'assignment_change', 'document_share'
  metadata: {                 // Flexible metadata based on type
    reactionType: String,     // For reactions: 'like', 'thumbs_up', etc.
    oldStatus: String,        // For status changes
    newStatus: String,        // For status changes
    sharedWith: [ObjectId],  // For document shares
    attachmentId: ObjectId,   // For document shares
  },
  parentComment: ObjectId,    // For nested replies (optional)
  isEdited: Boolean,
  editedAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Task Routes (`/api/v1/tasks`)

#### Basic CRUD Operations
- `POST /tasks` - Create a new task
- `GET /tasks` - List tasks with filtering, sorting, pagination
- `GET /tasks/:taskId` - Get task details
- `PATCH /tasks/:taskId` - Update task
- `DELETE /tasks/:taskId` - Delete task

#### Kanban Board Operations
- `GET /tasks/kanban-board` - Get tasks organized by status for Kanban view
- `PATCH /tasks/:taskId/status` - Update task status (for drag-and-drop)
- `PATCH /tasks/:taskId/reorder` - Reorder tasks within a status column

#### List View Operations
- `GET /tasks/list` - Get tasks in list/table format with all columns
- `GET /tasks/statistics` - Get task statistics (counts, trends)

#### Task Details Operations
- `GET /tasks/:taskId/details` - Get comprehensive task details with comments, sub-tasks, attachments

#### Sub-task Operations
- `POST /tasks/:taskId/sub-tasks` - Add a sub-task
- `PATCH /tasks/:taskId/sub-tasks/:subTaskId` - Update sub-task
- `DELETE /tasks/:taskId/sub-tasks/:subTaskId` - Delete sub-task
- `PATCH /tasks/:taskId/sub-tasks/:subTaskId/toggle` - Toggle sub-task completion

#### Comment/Discussion Operations
- `POST /tasks/:taskId/comments` - Add a comment
- `GET /tasks/:taskId/comments` - Get all comments for a task
- `PATCH /tasks/:taskId/comments/:commentId` - Update a comment
- `DELETE /tasks/:taskId/comments/:commentId` - Delete a comment
- `POST /tasks/:taskId/reactions` - Add a reaction (like)

#### Attachment Operations
- `POST /tasks/:taskId/attachments` - Upload attachment (uses existing upload middleware)
- `DELETE /tasks/:taskId/attachments/:attachmentId` - Delete attachment

#### Assignment Operations
- `PATCH /tasks/:taskId/assign` - Assign task to users
- `PATCH /tasks/:taskId/unassign` - Unassign users from task

## File Structure

```
src/
├── models/
│   ├── task.model.js              # Main task model
│   └── taskComment.model.js       # Task comments/discussions model
├── controllers/
│   ├── task.controller.js         # Task CRUD operations
│   └── taskComment.controller.js  # Comment operations
├── services/
│   ├── task.service.js            # Task business logic
│   └── taskComment.service.js     # Comment business logic
├── routes/
│   └── v1/
│       ├── task.route.js          # Task routes
│       └── taskComment.route.js   # Comment routes (or nested in task.route.js)
└── validations/
    ├── task.validation.js         # Task validation schemas
    └── taskComment.validation.js  # Comment validation schemas
```

## Implementation Steps

### Phase 1: Core Task Model & CRUD
1. Create `task.model.js` with all required fields
2. Create `task.service.js` with basic CRUD operations
3. Create `task.controller.js` with request handlers
4. Create `task.validation.js` with Joi schemas
5. Create `task.route.js` with basic routes
6. Register routes in `routes/v1/index.js`
7. Add task counter for auto-generating task IDs (SPK-{number})

### Phase 2: Project Integration
1. Ensure tasks require a project reference
2. Add project validation in task creation
3. Add project filtering in task queries
4. Update project model to optionally track task count

### Phase 3: Sub-tasks
1. Implement sub-task schema in task model
2. Add sub-task CRUD endpoints
3. Implement progress calculation based on sub-task completion
4. Add sub-task reordering support

### Phase 4: Comments & Discussions
1. Create `taskComment.model.js`
2. Implement comment CRUD operations
3. Add activity feed generation
4. Support different comment types (comment, reaction, status change, etc.)
5. Add comment notifications (if needed)

### Phase 5: Attachments
1. Integrate with existing upload middleware
2. Add attachment endpoints
3. Implement S3 file deletion on attachment removal
4. Add file size and type validation

### Phase 6: Kanban Board Support
1. Create `GET /tasks/kanban-board` endpoint
2. Return tasks grouped by status
3. Implement status update endpoint for drag-and-drop
4. Add task reordering within status columns

### Phase 7: List View & Statistics
1. Create list view endpoint with all columns
2. Implement task statistics endpoint
3. Add filtering and sorting capabilities
4. Create aggregation queries for statistics

### Phase 8: Advanced Features
1. Task search functionality
2. Task filtering by multiple criteria
3. Task export functionality (if needed)
4. Task templates (if needed)

## Validation Rules

### Task Creation
- `title`: Required, string, min 3 characters, max 200
- `project`: Required, valid ObjectId, must exist
- `status`: Optional, enum values, default: 'New'
- `priority`: Optional, enum values, default: 'Medium'
- `assignedTo`: Optional, array of valid User ObjectIds
- `dueDate`: Optional, must be a future date if provided
- `assignedDate`: Optional, defaults to current date
- `description`: Optional, string, max 5000 characters
- `tags`: Optional, array of strings, max 10 tags
- `progress`: Optional, number, 0-100, default: 0

### Task Update
- All fields optional (except immutable ones)
- Status transitions validation (e.g., can't go from 'Completed' to 'New')
- Progress validation (0-100)
- Due date validation (must be after assigned date)

### Sub-task
- `title`: Required, string, min 1 character, max 200
- `description`: Optional, string, max 1000 characters
- `order`: Optional, number, for sorting

### Comment
- `content`: Required, string, min 1 character, max 2000
- `type`: Required, enum values
- `task`: Required, valid ObjectId, must exist

## Access Control

### Task Access Rules
- **Admin**: Full access to all tasks
- **Project Creator**: Full access to tasks in their projects
- **Assigned User**: Can view and update tasks assigned to them
- **Project Members**: Can view tasks in projects they're assigned to
- **Others**: No access

### Task Modification Rules
- Only Admin, Project Creator, or Assigned User can update tasks
- Only Admin or Project Creator can delete tasks
- Only Admin, Project Creator, or Assigned User can assign/unassign tasks

## Task ID Generation

- Format: `{TASK_KEY}-{SEQUENCE_NUMBER}`
- Example: `SPK-123`
- Implementation:
  1. Store a counter in database or use auto-increment
  2. Generate on task creation
  3. Ensure uniqueness per project (optional) or globally

## Progress Calculation

- **Manual**: User sets progress percentage
- **Automatic**: Based on sub-task completion
  - Progress = (Completed Sub-tasks / Total Sub-tasks) * 100
  - If no sub-tasks, use manual progress

## Status Workflow

```
New (Backlog) → Todo → On Going (In Progress) → In Review → Completed (Done)
```

- Tasks can move forward or backward in workflow
- Completed tasks can be reopened (moved back to previous status)
- Status changes should be logged in activity feed

## Database Indexes

```javascript
// Task Model Indexes
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ taskId: 1 }, { unique: true });

// Task Comment Indexes
taskCommentSchema.index({ task: 1, createdAt: -1 });
taskCommentSchema.index({ user: 1 });
```

## Error Handling

- Task not found: 404
- Project not found: 404
- Unauthorized access: 403
- Invalid status transition: 400
- Validation errors: 400
- Duplicate task ID: 409

## Testing Considerations

### Unit Tests
- Task model validation
- Task service methods
- Progress calculation logic
- Status transition validation

### Integration Tests
- Task CRUD operations
- Project-task relationship
- Sub-task operations
- Comment operations
- Attachment upload/delete
- Access control

## Future Enhancements (Optional)

1. **Task Dependencies**: Link tasks that depend on each other
2. **Task Templates**: Pre-defined task templates for common workflows
3. **Task Recurring**: Recurring tasks (daily, weekly, monthly)
4. **Task Time Tracking**: Detailed time tracking with start/stop
5. **Task Notifications**: Email/push notifications for task updates
6. **Task Reminders**: Automated reminders for due dates
7. **Task Reports**: Advanced reporting and analytics
8. **Task Export**: Export tasks to CSV/PDF
9. **Task Import**: Bulk import tasks from CSV
10. **Task Automation**: Automated task creation based on rules

## Notes

- Follow existing codebase patterns (similar to project.model.js structure)
- Use existing plugins (toJSON, paginate)
- Integrate with existing S3 upload service
- Use existing authentication middleware
- Follow existing validation patterns (Joi schemas)
- Maintain consistency with existing API response formats

