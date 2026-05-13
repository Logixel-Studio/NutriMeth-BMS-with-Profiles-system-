import { useState } from 'react';
import { supabase, uploadFile } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Mail, Shield, Save, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/formatters';

export default function Profile() {
  const { user, profile, displayName, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  const initials = (fullName || user.email || 'U').charAt(0).toUpperCase();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await uploadFile(file, 'avatars');
      setAvatarUrl(file_url);
      await supabase.auth.updateUser({ data: { avatar_url: file_url } });
      await supabase.from('user_profiles').update({ avatar_url: file_url, updated_at: new Date().toISOString() }).eq('id', user.id);
      toast.success('Profile photo updated');
      refreshProfile?.();
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      await supabase.from('user_profiles').update({
        full_name: fullName,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
      toast.success('Profile updated');
      refreshProfile?.();
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal account information" />

      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCircle className="w-5 h-5" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-lg font-semibold">{fullName || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <label className="mt-2 inline-block cursor-pointer">
                    <span className="text-xs text-primary hover:underline">Change photo</span>
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email || ''} readOnly className="bg-muted mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <Label>Role</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium capitalize">Team Member</span>
                </div>
              </div>
              {user.created_at && (
                <div>
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-sm">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
