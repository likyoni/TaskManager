import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Shield, Zap, Smartphone, Layout } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-stone-100 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-stone-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-stone-800 transition-all text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-stone-900 text-white px-5 py-2 rounded-full font-semibold hover:bg-stone-800 transition-all text-sm shadow-lg shadow-stone-900/10"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3 fill-current" />
              Productivity Redefined
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 mb-8 leading-[1.1]">
              Manage tasks with <br />
              <span className="text-emerald-500 italic font-serif">effortless</span> precision.
            </h1>
            <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              TaskFlow is the professional-grade task management system designed for focus. 
              Minimalist interface, maximum performance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={user ? "/dashboard" : "/register"}
                className="w-full sm:w-auto bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 group"
              >
                {user ? 'Go to Dashboard' : 'Start for Free'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border border-stone-200 hover:bg-stone-50 transition-all"
              >
                View Features
              </a>
            </div>
          </motion.div>

          {/* Floating Elements Decoration */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-300 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-indigo-300 rounded-full blur-[120px]" />
          </div>
        </div>
      </section>

      {/* Social Proof / Trusted By */}
      <section className="py-12 border-y border-stone-100 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
            <span className="text-2xl font-black italic">VELOCITY</span>
            <span className="text-2xl font-bold tracking-tighter">QUANTUM</span>
            <span className="text-2xl font-serif italic">Aura</span>
            <span className="text-2xl font-mono">NEXUS</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for modern workflows</h2>
            <p className="text-stone-500 max-w-xl mx-auto">Everything you need to stay organized and productive, without the bloat.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-emerald-500" />,
                title: "Lightning Fast",
                desc: "Optimistic UI updates mean your tasks sync instantly without waiting for the server."
              },
              {
                icon: <Shield className="w-6 h-6 text-emerald-500" />,
                title: "Secure by Design",
                desc: "Enterprise-grade JWT authentication keeps your personal data safe and private."
              },
              {
                icon: <Layout className="w-6 h-6 text-emerald-500" />,
                title: "Clean Interface",
                desc: "A minimalist dashboard focused on what matters: getting your work done."
              },
              {
                icon: <Smartphone className="w-6 h-6 text-emerald-500" />,
                title: "Mobile Ready",
                desc: "Fully responsive design that works perfectly on your phone, tablet, or desktop."
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                title: "Task Tracking",
                desc: "Easily toggle status, filter by progress, and search through your history."
              },
              {
                icon: <ArrowRight className="w-6 h-6 text-emerald-500" />,
                title: "Scalable API",
                desc: "Built on a robust Node.js backend that handles your data with precision."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border border-stone-100 bg-stone-50/30 hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all"
              >
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-stone-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-stone-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Ready to master your <br className="hidden md:block" /> productivity?
            </h2>
            <p className="text-stone-400 max-w-lg mx-auto mb-10 text-lg">
              Join thousands of users who have simplified their workflow with TaskFlow.
            </p>
            <Link 
              to="/register"
              className="inline-flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <CheckCircle2 className="text-stone-900 w-5 h-5" />
            <span className="font-bold text-lg tracking-tight">TaskFlow</span>
          </div>
          <p className="text-stone-400 text-sm">
            © 2026 TaskFlow Inc. Built for precision.
          </p>
          <div className="flex items-center gap-6 text-sm font-semibold text-stone-400">
            <a href="#" className="hover:text-stone-900 transition-colors">Twitter</a>
            <a href="https://github.com/likyoni/" className="hover:text-stone-900 transition-colors">GitHub</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
