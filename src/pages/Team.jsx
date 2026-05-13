import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/lib/formatters';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersRound, UserCheck, UserPlus, ChevronDown, ChevronUp,
  Mail, CalendarDays, Search, Trash2, Pencil, Save, Crown
} from 'lucide-react';
import { toast } from 'sonner';

export default function Team() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, full_name }) => {
      const { error } = await supabase.from('user_profiles').update({ full_name, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Profile updated');
      setEditingMember(null);
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      // Only delete the profile row; auth user deletion requires admin
      const { error } = await supabase.from('user_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Member removed from team list');
      setDeleteId(null);
    },
    onError: () => toast.error('Could not remove member'),
  });

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (m.full_name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  // Sort: current user first
  const sorted = [...filtered].sort((a, b) => {
    if (a.id === user?.id) return -1;
    if (b.id === user?.id) return 1;
    return 0;
  });

  const totalMembers = members.length;
  const recentJoined = members.filter(m => {
    const d = new Date(m.created_at);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length;

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div>
      <PageHeader title="Team" description="All registered team members sharing this workspace" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <SummaryCard title="Total Members" value={String(totalMembers)} icon={UsersRound} />
        <SummaryCard title="Active Users" value={String(totalMembers)} icon={UserCheck} delay={0.05} />
        <SummaryCard title="Joined This Month" value={String(recentJoined)} icon={UserPlus} delay={0.1} />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9"
        />
      </div>

      {/* Member Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No team members found</p>
          <p className="text-sm mt-1">Team members appear here once they sign up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((member, idx) => {
            const isMe = member.id === user?.id;
            const isExpanded = expandedId === member.id;
            const initials = (member.full_name || member.email || 'U').charAt(0).toUpperCase();

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <Card className={`transition-all duration-200 hover:shadow-md ${isMe ? 'ring-1 ring-primary/30' : ''}`}>
                  <CardContent className="p-0">
                    {/* Header row */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => toggle(member.id)}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{member.full_name || 'No Name'}</p>
                          {isMe && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              <Crown className="w-3 h-3" /> You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          Joined {formatDate(member.created_at)}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-border space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
                              <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Email</p>
                                  <p className="font-medium break-all">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CalendarDays className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Member Since</p>
                                  <p className="font-medium">{formatDate(member.created_at)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Edit name inline */}
                            {editingMember === member.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  placeholder="Full name"
                                  className="h-8 text-sm"
                                  onKeyDown={e => e.key === 'Enter' && updateMut.mutate({ id: member.id, full_name: editName })}
                                />
                                <Button
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={() => updateMut.mutate({ id: member.id, full_name: editName })}
                                  disabled={updateMut.isPending}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingMember(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs"
                                  onClick={() => { setEditingMember(member.id); setEditName(member.full_name || ''); }}
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit Name
                                </Button>
                                {!isMe && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(member.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
        title="Remove team member?"
        description="This will remove the member from the team list. Their account remains active."
      />
    </div>
  );
}
