import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: 'todo' | 'completed';
  created_at: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  totalPages: number;
}
