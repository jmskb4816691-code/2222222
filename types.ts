
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  password?: string; // Added password field
}

export interface TaskFeedback {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignedToId: string; // User ID
  createdBy: string; // Admin ID
  dueDate: string;
  status: TaskStatus;
  createdAt: number;
  feedback?: TaskFeedback[]; // Array of feedback messages
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  taskId?: string;
  timestamp: number;
  read: boolean;
}
