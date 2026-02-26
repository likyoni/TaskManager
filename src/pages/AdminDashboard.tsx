import React from 'react';
import useSWR from 'swr';
import { useAuth } from '../AuthContext';
import { useApi } from '../useApi';
import { User } from '../types';
import { 
  Users, CheckCircle2, List, Trash2, ShieldCheck, 
  ArrowLeft, Loader2, BarChart3, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { fetchWithAuth } = useApi();

  const fetcher = async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  };

  const { data: stats } = useSWR('/api/admin/stats', fetcher);
  const { data: users, mutate: mutateUsers } = useSWR<User[]>('/api/admin/users', fetcher);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure? This will delete the user and all their tasks.')) return;
    
    try {
      const res = await fetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutateUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      alert('Error deleting user');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-stone-100 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-stone-500" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 w-6 h-6" />
              <span className="font-bold text-xl tracking-tight">Admin Console</span>
            </div>
          </div>
          <button onClick={logout} className="text-sm font-semibold text-stone-500 hover:text-red-500 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Users', value: stats?.users, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
            { label: 'Total Tasks', value: stats?.tasks, icon: <List className="w-5 h-5" />, color: 'bg-indigo-500' },
            { label: 'Completion Rate', value: stats?.tasks ? `${Math.round((stats.completedTasks / stats.tasks) * 100)}%` : '0%', icon: <Activity className="w-5 h-5" />, color: 'bg-emerald-500' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                  {stat.icon}
                </div>
                <BarChart3 className="w-4 h-4 text-stone-300" />
              </div>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value ?? '...'}</h3>
            </motion.div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-xl font-bold">User Management</h2>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full">
              {users?.length || 0} Registered
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-bold tracking-[0.1em]">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">{u.email}</td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!users && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-stone-300 mx-auto" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
