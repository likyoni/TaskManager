import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useApi } from '../useApi';
import { Task, TasksResponse } from '../types';
import { 
  Plus, Search, Filter, LogOut, CheckCircle2, Circle, 
  Trash2, Edit3, ChevronLeft, ChevronRight, Loader2,
  LayoutGrid, List as ListIcon, Calendar, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useApi();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetcher = async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  };

  const { data, error, mutate } = useSWR<TasksResponse>(
    `/api/tasks?page=${page}&status=${statusFilter}&search=${debouncedSearch}`,
    fetcher
  );

  const handleToggle = async (task: Task) => {
    // Optimistic update
    const updatedTasks = data?.tasks.map(t => 
      t.id === task.id ? { ...t, status: (t.status === 'completed' ? 'todo' : 'completed') as 'todo' | 'completed' } : t
    );
    mutate({ ...data!, tasks: updatedTasks! }, false);

    try {
      await fetchWithAuth(`/api/tasks/${task.id}/toggle`, { method: 'PATCH' });
      mutate();
    } catch (e) {
      mutate(); // Rollback
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const updatedTasks = data?.tasks.filter(t => t.id !== id);
    mutate({ ...data!, tasks: updatedTasks! }, false);

    try {
      await fetchWithAuth(`/api/tasks/${id}`, { method: 'DELETE' });
      mutate();
    } catch (e) {
      mutate();
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PATCH' : 'POST';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({ title: taskTitle, description: taskDesc }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingTask(null);
        setTaskTitle('');
        setTaskDesc('');
        mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </Link>

          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-stone-500">{user?.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex flex-1 w-full gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={openAddModal}
            className="w-full md:w-auto bg-stone-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {!data && !error ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Loading your tasks...</p>
            </div>
          ) : data?.tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">No tasks found</h3>
              <p className="text-stone-500 max-w-xs mx-auto mt-1">
                {search || statusFilter !== 'all' 
                  ? "Try adjusting your filters or search query." 
                  : "Get started by creating your first task!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {data?.tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group bg-white p-4 rounded-2xl border transition-all hover:shadow-md flex items-start gap-4",
                      task.status === 'completed' ? "border-stone-100 bg-stone-50/50" : "border-stone-200"
                    )}
                  >
                    <button 
                      onClick={() => handleToggle(task)}
                      className={cn(
                        "mt-1 transition-colors",
                        task.status === 'completed' ? "text-emerald-500" : "text-stone-300 hover:text-stone-400"
                      )}
                    >
                      {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold text-lg truncate",
                        task.status === 'completed' && "text-stone-400 line-through"
                      )}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={cn(
                          "text-sm mt-1 line-clamp-2",
                          task.status === 'completed' ? "text-stone-300" : "text-stone-500"
                        )}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-stone-400">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                          task.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
                        )}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(task)}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-stone-200 rounded-xl disabled:opacity-30 hover:bg-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-stone-500">
              Page {page} of {data.totalPages}
            </span>
            <button 
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-stone-200 rounded-xl disabled:opacity-30 hover:bg-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 tracking-tight">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <form onSubmit={handleSaveTask} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 ml-1">
                    Task Title
                  </label>
                  <input 
                    autoFocus
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="What needs to be done?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 ml-1">
                    Description (Optional)
                  </label>
                  <textarea 
                    rows={4}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                    placeholder="Add some details..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-stone-200 rounded-2xl font-semibold hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-stone-900 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTask ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
