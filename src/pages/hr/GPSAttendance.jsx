/**
 * GPS Attendance — HR/Admin view
 * Real office locations from Supabase, real attendance feed
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useOfficeLocations, useAllAttendance } from '@/hooks/useAttendance';
import { usePayrollRules } from '@/hooks/useAttendance';
import {
  Navigation, MapPin, Clock, CheckCircle, XCircle, Plus,
  Settings2, Trash2, Edit2, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function GPSAttendance() {
  const qc = useQueryClient();
  const { data: offices = [], isLoading: offLoading } = useOfficeLocations();
  const { data: todayRecords = [], isLoading: attLoading } = useAllAttendance();
  const { data: rules } = usePayrollRules();

  const [showAddOffice, setShowAddOffice] = useState(false);
  const [showEditRules, setShowEditRules] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', lat: '', lng: '', radius_meters: 200 });
  const [rulesForm, setRulesForm] = useState({
    office_start_time: '09:00',
    grace_period_minutes: 15,
    late_deduction_per_minute: 20,
    half_day_threshold_minutes: 120,
    overtime_rate_multiplier: 1.5,
    work_hours_per_day: 9,
  });

  // Sync rules form when data loads
  useState(() => { if (rules) setRulesForm(r => ({ ...r, ...rules })); });

  const addOffice = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.lat || !form.lng) throw new Error('Name, lat, lng required');
      const { error } = await supabase.from('office_locations').insert([{
        ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        radius_meters: parseInt(form.radius_meters) || 200, is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['office_locations'] });
      setShowAddOffice(false);
      setForm({ name: '', city: '', lat: '', lng: '', radius_meters: 200 });
      toast.success('Office location added');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteOffice = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('office_locations').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['office_locations'] }); toast.success('Office removed'); },
    onError: (e) => toast.error(e.message),
  });

  const saveRules = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from('payroll_rules').select('id').limit(1).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('payroll_rules').update({ ...rulesForm, updated_at: new Date().toISOString() }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payroll_rules').insert([rulesForm]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll_rules'] });
      setShowEditRules(false);
      toast.success('Attendance rules saved');
    },
    onError: (e) => toast.error(e.message),
  });

  const presentToday = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;

  return (
    <div>
      <PageHeader title="GPS Attendance" description="Office geo-fencing and real-time attendance tracking">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditRules(true)}>
            <Settings2 className="w-4 h-4 mr-2" /> Rules
          </Button>
          <Button onClick={() => setShowAddOffice(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Office
          </Button>
        </div>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Checked In', value: String(presentToday + lateToday), c: 'text-emerald-500', icon: CheckCircle },
          { label: 'Late Today', value: String(lateToday), c: 'text-amber-500', icon: Clock },
          { label: 'Records Today', value: String(todayRecords.length), c: 'text-blue-500', icon: Navigation },
          { label: 'Office Locations', value: String(offices.length), c: 'text-primary', icon: MapPin },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.c}`} />
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Office Locations */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Office Geo-Fences</h3>
            {offLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="space-y-3">
            {offices.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.city} · Radius: {o.radius_meters}m</p>
                  <p className="text-xs font-mono text-muted-foreground/70">{Number(o.lat).toFixed(5)}, {Number(o.lng).toFixed(5)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    onClick={() => { if (confirm('Remove this office?')) deleteOffice.mutate(o.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {!offLoading && offices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No office locations added yet</p>
            )}
          </div>
        </div>

        {/* Today's Attendance Feed */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Today's Attendance Feed</h3>
            {attLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {todayRecords.length === 0 && !attLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">No attendance records for today</p>
            )}
            {todayRecords.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {(r.user_profiles?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{r.user_profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.office_name || 'Office'}
                    {r.check_in && ` · In: ${new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    {r.check_out && ` · Out: ${new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                  {r.late_minutes > 0 && (
                    <p className="text-xs text-amber-500">{r.late_minutes}m late · Deduction: PKR {r.late_deduction?.toLocaleString()}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLES[r.status] || STATUS_STYLES.present}`}>
                  {r.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Rules Display */}
      {rules && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Current Attendance Rules</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Start Time', value: rules.office_start_time },
              { label: 'Grace Period', value: `${rules.grace_period_minutes} mins` },
              { label: 'Late Fine/min', value: `PKR ${rules.late_deduction_per_minute}` },
              { label: 'Half-day at', value: `${rules.half_day_threshold_minutes} mins late` },
              { label: 'OT Multiplier', value: `${rules.overtime_rate_multiplier}x` },
              { label: 'Work Hours', value: `${rules.work_hours_per_day}h/day` },
            ].map(r => (
              <div key={r.label} className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className="text-sm font-bold text-foreground">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Office Dialog */}
      <Dialog open={showAddOffice} onOpenChange={setShowAddOffice}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Office Location</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Office Name *', key: 'name', placeholder: 'e.g. Head Office' },
              { label: 'City', key: 'city', placeholder: 'e.g. Karachi' },
              { label: 'Latitude *', key: 'lat', placeholder: '24.8607' },
              { label: 'Longitude *', key: 'lng', placeholder: '67.0011' },
              { label: 'Geo-fence Radius (metres)', key: 'radius_meters', placeholder: '200' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input className="mt-1.5" placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={() => addOffice.mutate()} disabled={addOffice.isPending} className="flex-1">
                {addOffice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Location'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddOffice(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rules Dialog */}
      <Dialog open={showEditRules} onOpenChange={setShowEditRules}>
        <DialogContent>
          <DialogHeader><DialogTitle>Attendance Rules Configuration</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Office Start Time', key: 'office_start_time', type: 'time' },
              { label: 'Grace Period (minutes)', key: 'grace_period_minutes', type: 'number' },
              { label: 'Late Deduction per Minute (PKR)', key: 'late_deduction_per_minute', type: 'number' },
              { label: 'Half-day threshold (minutes late)', key: 'half_day_threshold_minutes', type: 'number' },
              { label: 'Overtime Rate Multiplier (e.g. 1.5)', key: 'overtime_rate_multiplier', type: 'number', step: '0.1' },
              { label: 'Work Hours Per Day', key: 'work_hours_per_day', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input className="mt-1.5" type={f.type || 'text'} step={f.step} value={rulesForm[f.key]}
                  onChange={e => setRulesForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={() => saveRules.mutate()} disabled={saveRules.isPending} className="flex-1">
                {saveRules.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Rules'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditRules(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
