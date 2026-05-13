import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Sign in failed');
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } }
      });
      if (error) throw error;
      // Upsert profile
      if (data.user) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          full_name: form.fullName,
          email: form.email,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
      if (data.session) {
        toast.success(`Welcome, ${form.fullName}!`);
      } else {
        toast.success('Account created! Please check your email to verify.');
        setMode('signin');
      }
    } catch (err) {
      toast.error(err.message || 'Sign up failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email!');
      setMode('signin');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/25">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">NUTRIMETH</h1>
          <p className="text-sm text-muted-foreground mt-1">Business Management System</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* SIGN IN */}
          {mode === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
              <p className="text-sm text-muted-foreground mb-6">Sign in to your team account</p>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      className="pl-9 pr-9"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            </motion.div>
          )}

          {/* SIGN UP */}
          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-1">Create account</h2>
              <p className="text-sm text-muted-foreground mb-6">Join your team on NUTRIMETH BMS</p>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Ahmed Khan"
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      className="pl-9"
                      autoComplete="name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email2"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password2"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      className="pl-9 pr-9"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <button onClick={() => setMode('signin')} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </motion.div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-1">Reset password</h2>
              <p className="text-sm text-muted-foreground mb-6">We'll send a reset link to your email</p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email3">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email3"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                <button onClick={() => setMode('signin')} className="text-primary font-medium hover:underline">
                  ← Back to Sign In
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
