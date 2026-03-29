import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  History, 
  Copy, 
  Check, 
  LogOut, 
  LogIn,
  UserPlus,
  Trash2, 
  ChevronRight,
  Info,
  ArrowRight,
  Zap,
  Shield,
  Cpu,
  Globe
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, signInWithGoogle, signUpWithEmailPassword, loginWithEmailPassword, logout } from './firebase';
import { cn } from './lib/utils';

interface EnhancedPrompt {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  createdAt: any;
  userId: string;
}

// --- Constants ---
const TEMPLATES = [
  { id: 'story', label: 'Creative Story', text: 'Write a short story about a time-traveling librarian who discovers a book that shouldn\'t exist.' },
  { id: 'code', label: 'Code Refactor', text: 'Refactor this code to be more efficient, readable, and follow best practices: \n\nfunction calculate(a, b) {\n  let r = 0;\n  for(let i=0; i<a.length; i++) {\n    r += a[i] * b;\n  }\n  return r;\n}' },
  { id: 'marketing', label: 'Marketing Copy', text: 'Write a compelling social media ad copy for a new premium, eco-friendly reusable coffee cup targeting busy urban professionals.' },
  { id: 'tech', label: 'Technical Guide', text: 'Explain the concept of "Quantum Entanglement" in simple terms that a 10-year-old can understand, using a relatable analogy.' },
  { id: 'email', label: 'Professional Email', text: 'Draft a professional yet empathetic email to a long-term client explaining a 2-week delay in their software project due to unforeseen technical debt.' }
];

const SYSTEM_INSTRUCTION = `You are an expert Prompt Engineer. Your goal is to transform a simple, basic prompt into a highly effective, detailed, and structured prompt that will yield superior results from an AI model. 

When enhancing a prompt:
1.  **Contextualize**: Add necessary background information.
2.  **Specify**: Define the desired output format, tone, and audience.
3.  **Constraints**: Add clear boundaries or requirements.
4.  **Examples**: If applicable, suggest where examples could be added.
5.  **Structure**: Use clear headings or bullet points for readability.

Provide ONLY the enhanced prompt in your response. Do not include any introductory or concluding remarks.`;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Firebase Auth & Connection Test ---
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.error("Firestore connection failed. Check configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.3, repeat: Infinity }}
          className="text-white font-light tracking-widest"
        >
          LOADING...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* --- Background Animation --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none page-gradient-aurora">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-600/20 to-transparent blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-500/20 to-transparent blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 45, 0],
            x: [0, -80, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 left-1/3 w-2/3 h-2/3 bg-gradient-to-br from-cyan-500/10 to-transparent blur-[140px] rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        {!user ? (
          <Landing key="landing" />
        ) : (
          <Dashboard 
            key="dashboard" 
            user={user} 
          />
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tight">Prompt Enhancer</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-medium text-white/40 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
          <p className="text-xs text-white/20">© 2026 Prompt Enhancer Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Landing() {
  const authCardRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const openAuthMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthError(null);
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const mapFirebaseAuthError = (error: unknown) => {
    const authCode = (error as { code?: string } | null)?.code || '';
    const message = (error as { message?: string } | null)?.message || '';

    if (authCode.includes('auth/invalid-email')) return 'Please enter a valid email address.';
    if (authCode.includes('auth/email-already-in-use')) return 'This email is already registered. Try logging in.';
    if (authCode.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
    if (authCode.includes('auth/invalid-credential')) return 'Invalid email or password.';
    if (authCode.includes('auth/invalid-login-credentials')) return 'Invalid email or password.';
    if (authCode.includes('auth/user-not-found')) return 'No account found with this email.';
    if (authCode.includes('auth/wrong-password')) return 'Invalid email or password.';
    if (authCode.includes('auth/too-many-requests')) return 'Too many attempts. Please wait and try again.';
    if (authCode.includes('auth/network-request-failed')) return 'Network error. Please check your connection and try again.';
    if (authCode.includes('auth/operation-not-allowed')) {
      return 'Email/password login is disabled in Firebase. Enable Email/Password sign-in method.';
    }
    if (authCode.includes('auth/unauthorized-domain')) {
      return 'This domain is not authorized for Google sign-in. Add your Vercel domain in Firebase Console > Authentication > Settings > Authorized domains.';
    }
    if (authCode.includes('auth/popup-blocked')) {
      return 'Popup blocked by browser. The app will use redirect sign-in automatically. Please try again.';
    }

    if (message.includes('auth/operation-not-allowed')) {
      return 'Email/password login is disabled in Firebase. Enable Email/Password sign-in method.';
    }
    if (message.includes('auth/unauthorized-domain')) {
      return 'This domain is not authorized for Google sign-in. Add your Vercel domain in Firebase Console > Authentication > Settings > Authorized domains.';
    }

    return 'Authentication failed. Please try again.';
  };

  const onGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmailPassword(normalizedEmail, password);
      } else {
        await loginWithEmailPassword(normalizedEmail, password);
      }
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10"
    >
      {/* --- Nav --- */}
      <nav className="flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">PROMPT <span className="text-orange-500">Enhancer</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/40">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#templates" className="hover:text-white transition-colors">Templates</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => openAuthMode('login')}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-white/60 hover:text-white transition-all text-sm font-bold"
          >
            Login
          </button>
          <button 
            onClick={() => openAuthMode('signup')}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-white/90 rounded-full transition-all text-sm font-bold shadow-xl shadow-white/5"
          >
            <LogIn className="w-4 h-4" />
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* --- Hero --- */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-6 hero-kicker-glow"
            >
              <Zap className="w-3 h-3" />
              Next-Gen Prompt Engineering
            </motion.div>
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.85] mb-6 hero-title-shadow"
            >
              BETTER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-amber-400 animate-hero-gradient">PROMPTS.</span> <br />
              BETTER <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-amber-400 animate-hero-gradient">AI Output.</span>
            </motion.h1>
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-white/60 text-lg max-w-lg leading-relaxed mb-8 hero-subtext-shimmer"
            >
              Stop guessing. Start engineering. Transform your basic ideas into 
              high-performance instructions that unlock the full potential of LLMs.
            </motion.p>
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button 
                onClick={() => openAuthMode('signup')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-orange-500 text-black rounded-2xl font-bold hover:bg-orange-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <a 
                href="#templates"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-center"
              >
                View Templates
              </a>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div ref={authCardRef} className="bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-[40px] border border-white/10 backdrop-blur-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold tracking-tight">{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h3>
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    openAuthMode('login');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                    authMode === 'login' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                  )}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    openAuthMode('signup');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                    authMode === 'signup' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                  )}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={onSubmitAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>
              )}

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all',
                  isSubmitting
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-orange-500 text-black hover:bg-orange-400'
                )}
              >
                {authMode === 'signup' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {isSubmitting ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="h-px bg-white/10" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 text-[10px] uppercase tracking-widest text-white/30 bg-[#141414]">or</span>
            </div>

            <button
              onClick={onGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all font-semibold"
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              Continue with Google
            </button>

            <p className="mt-4 text-center text-xs text-white/35">
              {authMode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
              <button
                onClick={() => {
                  openAuthMode(authMode === 'signup' ? 'login' : 'signup');
                }}
                className="text-orange-400 hover:text-orange-300 transition-colors font-semibold"
              >
                {authMode === 'signup' ? 'Login' : 'Sign up'}
              </button>
            </p>
          </div>
        </motion.div>
      </section>

      {/* --- Features --- */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: Cpu, title: "Advanced Logic", desc: "Uses state-of-the-art prompt engineering patterns to structure your requests." },
            { icon: Shield, title: "Secure & Private", desc: "Your prompts and API keys are handled with the highest security standards." },
            { icon: Globe, title: "Universal", desc: "Optimized for Gemini, GPT-4, Claude, and all major large language models." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(249, 115, 22, 0.3)' }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-[32px] transition-colors"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <feature.icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- How it Works --- */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How it Works</h2>
          <p className="text-white/40 max-w-2xl mx-auto">Three simple steps to unlock the full potential of AI.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Input", desc: "Enter your basic prompt or idea into our intuitive interface." },
            { step: "02", title: "Enhance", desc: "Our AI applies expert engineering patterns to structure and detail your request." },
            { step: "03", title: "Unleash", desc: "Copy your high-performance prompt and get superior results from any LLM." }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -10 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group"
            >
              <div className="text-6xl font-black text-white/5 absolute -top-4 -right-4 group-hover:text-orange-500/10 transition-colors">
                {item.step}
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Templates Preview --- */}
      <section id="templates" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16"
        >
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Ready-to-use Templates</h2>
            <p className="text-white/40">Explore our curated collection of expert-crafted prompt templates for every use case.</p>
          </div>
          <button 
            onClick={onGoogleSignIn}
            className="flex items-center gap-2 text-orange-500 font-bold hover:gap-4 transition-all"
          >
            Explore All <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.slice(0, 3).map((template, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, borderColor: 'rgba(249, 115, 22, 0.3)' }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 flex flex-col transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-widest">
                  {template.label}
                </span>
              </div>
              <p className="text-sm text-white/60 line-clamp-3 flex-1 italic">"{template.text}"</p>
              <button 
                onClick={onGoogleSignIn}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
              >
                Use Template
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-12 md:p-24 bg-gradient-to-br from-orange-600 to-orange-400 rounded-[48px] overflow-hidden text-center"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="relative z-10 space-y-8">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-7xl font-bold text-black tracking-tighter leading-none"
            >
              READY TO BUILD <br /> BETTER PROMPTS?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-black/60 text-lg max-w-xl mx-auto font-medium"
            >
              Join thousands of users who are unlocking the true power of AI with PromptPro.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.6 }}
              onClick={onGoogleSignIn}
              className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-bold transition-all shadow-2xl shadow-black/20"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

function Dashboard({ user }: { user: User }) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [enhancementStyle, setEnhancementStyle] = useState('detailed');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementStep, setEnhancementStep] = useState(0);
  const [enhancedResult, setEnhancedResult] = useState('');
  const [history, setHistory] = useState<EnhancedPrompt[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancementSteps = [
    "Analyzing your prompt...",
    "Applying engineering patterns...",
    "Optimizing structure...",
    "Finalizing enhancement..."
  ];

  const resultRef = useRef<HTMLDivElement>(null);

  // --- Step Timer ---
  useEffect(() => {
    let interval: any;
    if (isEnhancing) {
      setEnhancementStep(0);
      interval = setInterval(() => {
        setEnhancementStep((prev) => (prev + 1) % enhancementSteps.length);
      }, 1500);
    } else {
      setEnhancementStep(0);
    }
    return () => clearInterval(interval);
  }, [isEnhancing]);

  // --- Fetch History ---
  useEffect(() => {
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedPrompt[];

      // Sort client-side to avoid requiring a composite Firestore index.
      items.sort((a, b) => {
        const aTime = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
        const bTime = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      setHistory(items);
    }, (err) => {
      console.error("Firestore Error:", err);
      setError("Failed to load history. Please check your permissions.");
    });

    return () => unsubscribe();
  }, [user]);

  // --- AI Logic ---
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const isTemporaryGeminiError = (error: unknown) => {
    const message = (error as { message?: string } | null)?.message?.toLowerCase() || '';
    return (
      message.includes('"code":503') ||
      message.includes('status":"unavailable"') ||
      message.includes('currently experiencing high demand') ||
      message.includes('service unavailable')
    );
  };

  const isApiKeyError = (error: unknown) => {
    const message = (error as { message?: string } | null)?.message || '';
    return (
      message.includes('Requested entity was not found') ||
      message.includes('API key') ||
      message.includes('VITE_GEMINI_API_KEY')
    );
  };

  const enhancePrompt = async () => {
    if (!inputPrompt.trim()) return;
    
    setIsEnhancing(true);
    setError(null);
    setEnhancedResult('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is missing. Add it in your environment file.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const styleInstruction = `Enhance the prompt in a ${enhancementStyle} style. ${
        enhancementStyle === 'detailed' ? 'Add as much relevant detail and context as possible.' :
        enhancementStyle === 'concise' ? 'Keep it brief but highly effective and direct.' :
        'Be highly creative, imaginative, and use evocative language.'
      }`;

      const configuredModels = (import.meta.env.VITE_GEMINI_MODELS || '')
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean);

      const modelCandidates = configuredModels.length > 0
        ? configuredModels
        : ['gemini-2.5-flash', 'gemini-3-flash-preview'];

      const configuredRetries = Number(import.meta.env.VITE_GEMINI_MAX_RETRIES || '1');
      const retryCount = Number.isFinite(configuredRetries)
        ? Math.min(2, Math.max(0, Math.floor(configuredRetries)))
        : 1;
      const maxAttempts = retryCount + 1;

      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let lastError: unknown = null;

      for (const modelName of modelCandidates) {
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: inputPrompt,
              config: {
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${styleInstruction}`,
                temperature: enhancementStyle === 'creative' ? 0.9 : 0.7,
              },
            });
            break;
          } catch (generationError) {
            lastError = generationError;

            if (isApiKeyError(generationError)) {
              throw generationError;
            }

            const shouldRetry = isTemporaryGeminiError(generationError) && attempt < maxAttempts;
            if (shouldRetry) {
              // Short exponential backoff for low-latency retries.
              await wait(400 * Math.pow(2, attempt - 1));
              continue;
            }

            // Move to the next model candidate.
            break;
          }
        }

        if (response) {
          break;
        }
      }

      if (!response) {
        throw lastError || new Error('No response generated.');
      }

      const result = response.text || "Failed to generate enhancement.";
      setEnhancedResult(result);

      // Save to history
      await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        originalPrompt: inputPrompt,
        enhancedPrompt: result,
        createdAt: serverTimestamp(),
      });

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error("Enhancement Error:", err);
      if (isApiKeyError(err)) {
        setError("Gemini API key is missing or invalid. Set VITE_GEMINI_API_KEY in your environment.");
      } else if (isTemporaryGeminiError(err)) {
        setError("Gemini is currently under high load. I retried and switched models automatically, but it is still busy. Please try again shortly.");
      } else {
        setError(err.message || "An unexpected error occurred during enhancement.");
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(enhancedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'prompts', id));
    } catch (err) {
      console.error("Delete Error:", err);
      setError("Failed to delete history item.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-10"
    >
      {/* --- Navigation --- */}
      <nav className="flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">PROMPT<span className="text-orange-500">PRO</span></span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
            title="History"
          >
            <History className="w-5 h-5" />
            {history.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-white/50 font-medium uppercase tracking-widest">User</span>
            <span className="text-sm font-medium">{user.displayName || user.email}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-sm font-medium border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[0.9]">
            ENHANCE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">IMAGINATION.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Transform basic ideas into powerful AI instructions. 
            Our Prompt Enhancer uses advanced engineering patterns to 
            deliver superior results.
          </p>
        </header>

        {/* --- Templates Section --- */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-white/40">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Try a Template</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setInputPrompt(template.text)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                  inputPrompt === template.text
                    ? "bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {template.label}
              </button>
            ))}
          </div>
        </section>

        {/* --- Input Section --- */}
        <section className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/40">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Original Prompt</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                {['detailed', 'concise', 'creative'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setEnhancementStyle(style)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      enhancementStyle === style
                        ? "bg-white/10 text-white"
                        : "text-white/30 hover:text-white/60"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Enter your basic prompt here... (e.g., 'Write a story about a cat')"
                className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-2xl font-light placeholder:text-white/20 min-h-[150px] resize-none"
              />
              {inputPrompt && (
                <button 
                  onClick={() => setInputPrompt('')}
                  className="absolute top-0 right-0 p-2 text-white/20 hover:text-white/60 transition-colors"
                  title="Clear"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-end gap-4 mt-6 pt-6 border-t border-white/10">
              <button 
                onClick={enhancePrompt}
                disabled={isEnhancing || !inputPrompt.trim()}
                className={cn(
                  "w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg relative overflow-hidden",
                  isEnhancing || !inputPrompt.trim()
                    ? "bg-white/5 text-white/20 cursor-not-allowed" 
                    : "bg-orange-500 text-black hover:bg-orange-400 hover:scale-[1.02] active:scale-[0.98] shadow-orange-500/20"
                )}
              >
                {isEnhancing ? (
                  <>
                    <motion.div 
                      key={enhancementStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                      <span className="text-sm">{enhancementSteps[enhancementStep]}</span>
                    </motion.div>
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 w-full bg-white/30"
                    />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Enhance Prompt
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </motion.div>
          )}

          {/* --- Result Section --- */}
          <AnimatePresence mode="wait">
            {enhancedResult && (
              <motion.div 
                ref={resultRef}
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="bg-gradient-to-b from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl relative group/result"
              >
                {/* Shimmer effect on entry */}
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10"
                />

                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-bottom border-white/10 relative z-20">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: 1 }}
                      className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50" 
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">Enhanced Result</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-xs font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                </div>
                <div className="p-8 prose prose-invert prose-orange max-w-none relative z-20">
                  <ReactMarkdown>{enhancedResult}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* --- History Sidebar (Overlay) --- */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              />
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col"
              >
                <div className="p-8 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-orange-500" />
                    <h2 className="text-xl font-bold">History</h2>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-white/5 rounded-full"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-white/40 text-sm">No history yet. Start enhancing!</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id}
                        className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          setInputPrompt(item.originalPrompt);
                          setEnhancedResult(item.enhancedPrompt);
                          setShowHistory(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60 mb-1">
                              {item.createdAt?.toDate().toLocaleDateString()}
                            </span>
                            <p className="text-sm font-bold line-clamp-2 text-white/90">{item.originalPrompt}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(item.enhancedPrompt);
                                // Optional: show a small toast or temporary icon change
                              }}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white"
                              title="Quick Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id);
                              }}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-3 bg-orange-500 rounded-full" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Enhanced Preview</span>
                          </div>
                          <p className="text-xs text-white/50 line-clamp-4 leading-relaxed italic">
                            {item.enhancedPrompt}
                          </p>
                        </div>

                        {/* Hover indicator */}
                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-orange-500 group-hover:w-full transition-all duration-500" />
                      </div>
                    ))
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
