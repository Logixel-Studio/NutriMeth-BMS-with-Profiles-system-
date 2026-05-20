import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Navigation, MapPin, Clock, CheckCircle, XCircle, Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const MOCK_OFFICES = [
  { id: 1, name: 'Head Office', lat: 24.8607, lng: 67.0011, radius: 200, city: 'Karachi' },
  { id: 2, name: 'Branch Office', lat: 24.9056, lng: 67.0822, radius: 150, city: 'Karachi North' },
];

const MOCK_RECORDS = [
  { id: 1, employee: 'Ahmed Khan', time: '09:02 AM', status: 'on_time', location: 'Head Office', type: 'check_in' },
  { id: 2, employee: 'Sara Ali', time: '09:18 AM', status: 'late', location: 'Head Office', type: 'check_in' },
  { id: 3, employee: 'Bilal Raza', time: '09:00 AM', status: 'on_time', location: 'Branch Office', type: 'check_in' },
  { id: 4, employee: 'Fatima Noor', time: '06:01 PM', status: 'on_time', location: 'Head Office', type: 'check_out' },
];

const STATUS_STYLES = {
  on_time: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function GPSAttendance() {
  const [offices, setOffices] = useState(MOCK_OFFICES);
  const [records] = useState(MOCK_RECORDS);
  const [showAddOffice, setShowAddOffice] = useState(false);
  const [newOffice, setNewOffice] = useState({ name: '', lat: '', lng: '', radius: 200, city: '' });

  const handleAddOffice = () => {
    if (!newOffice.name || !newOffice.lat || !newOffice.lng) {
      toast.error('Please fill all required fields');
      return;
    }
    setOffices(prev => [...prev, { id: Date.now(), ...newOffice, lat: parseFloat(newOffice.lat), lng: parseFloat(newOffice.lng) }]);
    setNewOffice({ name: '', lat: '', lng: '', radius: 200, city: '' });
    setShowAddOffice(false);
    toast.success('Office location added');
  };

  return (
    <div>
      <PageHeader title="GPS Attendance" description="Geo-fenced attendance tracking with location verification">
        <Button onClick={() => setShowAddOffice(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Office Location
        </Button>
      </PageHeader>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Checked In', value: '24', color: 'bg-emerald-500', icon: CheckCircle },
          { label: 'Late Arrivals', value: '3', color: 'bg-amber-500', icon: Clock },
          { label: 'Not Yet In', value: '5', color: 'bg-red-500', icon: XCircle },
          { label: 'Office Locations', value: String(offices.length), color: 'bg-blue-500', icon: MapPin },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.color}/10`}>
              <s.icon className={`w-5 h-5 text-${s.color.replace('bg-', '')}`} />
            </div>
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
            <span className="text-xs text-muted-foreground">{offices.length} locations</span>
          </div>
          <div className="space-y-3">
            {offices.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{o.city} · Radius: {o.radius}m</p>
                  <p className="text-xs font-mono text-muted-foreground/70">{o.lat.toFixed(4)}, {o.lng.toFixed(4)}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Today's Attendance Feed */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Today's Attendance Feed</h3>
          <div className="space-y-3">
            {records.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {r.employee[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{r.employee}</p>
                  <p className="text-xs text-muted-foreground">{r.location} · {r.type === 'check_in' ? '🟢 Check In' : '🔴 Check Out'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{r.time}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Attendance Rules</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Office Start Time', value: '09:00 AM', desc: 'Shifts begin' },
            { label: 'Grace Period', value: '15 minutes', desc: 'Before late mark' },
            { label: 'Late Deduction', value: '2% / day', desc: 'From monthly salary' },
          ].map(rule => (
            <div key={rule.label} className="p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">{rule.label}</p>
              <p className="font-semibold text-foreground">{rule.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Office Dialog */}
      <Dialog open={showAddOffice} onOpenChange={setShowAddOffice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Office Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Office Name *</Label>
              <Input className="mt-1.5" placeholder="e.g. Head Office" value={newOffice.name} onChange={e => setNewOffice(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>City</Label>
              <Input className="mt-1.5" placeholder="e.g. Karachi" value={newOffice.city} onChange={e => setNewOffice(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Latitude *</Label>
                <Input className="mt-1.5" placeholder="24.8607" value={newOffice.lat} onChange={e => setNewOffice(p => ({ ...p, lat: e.target.value }))} />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input className="mt-1.5" placeholder="67.0011" value={newOffice.lng} onChange={e => setNewOffice(p => ({ ...p, lng: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Geo-fence Radius (meters)</Label>
              <Input className="mt-1.5" type="number" value={newOffice.radius} onChange={e => setNewOffice(p => ({ ...p, radius: parseInt(e.target.value) }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddOffice} className="flex-1">Add Location</Button>
              <Button variant="outline" onClick={() => setShowAddOffice(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
