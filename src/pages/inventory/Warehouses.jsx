import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Building2, Plus, Package, MapPin, Phone, Edit2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const INIT_WH = [
  { id: 1, name: 'Main Warehouse', location: 'Korangi Industrial Area, Karachi', capacity: 10000, used: 6800, manager: 'Usman Tariq', phone: '+92-21-1234567', products: 245 },
  { id: 2, name: 'Cold Storage Unit', location: 'Landhi, Karachi', capacity: 3000, used: 2100, manager: 'Fatima Noor', phone: '+92-21-7654321', products: 48 },
  { id: 3, name: 'Distribution Hub', location: 'SITE, Karachi', capacity: 5000, used: 1800, manager: 'Bilal Raza', phone: '+92-21-5556789', products: 120 },
];

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState(INIT_WH);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', capacity: '', manager: '', phone: '' });

  const addWH = () => {
    if (!form.name || !form.location) return toast.error('Name and location required');
    setWarehouses(prev => [...prev, { id: Date.now(), ...form, capacity: parseInt(form.capacity) || 1000, used: 0, products: 0 }]);
    setForm({ name: '', location: '', capacity: '', manager: '', phone: '' });
    setShowAdd(false);
    toast.success('Warehouse added');
  };

  return (
    <div>
      <PageHeader title="Warehouse Management" description="Manage all warehouse locations and capacities">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Warehouse</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Warehouses', value: String(warehouses.length) },
          { label: 'Total Capacity', value: `${warehouses.reduce((s, w) => s + w.capacity, 0).toLocaleString()} units` },
          { label: 'Total Utilization', value: `${Math.round(warehouses.reduce((s, w) => s + w.used, 0) / warehouses.reduce((s, w) => s + w.capacity, 0) * 100)}%` },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {warehouses.map((wh, i) => {
          const utilPct = Math.round((wh.used / wh.capacity) * 100);
          const color = utilPct > 85 ? 'bg-red-500' : utilPct > 60 ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <motion.div key={wh.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{wh.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{wh.location}</p>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost"><Edit2 className="w-4 h-4" /></Button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Capacity Usage</span>
                    <span className="font-semibold">{wh.used.toLocaleString()} / {wh.capacity.toLocaleString()} units</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${utilPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{utilPct}% utilized</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{wh.products}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-foreground">{utilPct}%</p>
                    <p className="text-xs text-muted-foreground">Usage</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Manager: <span className="text-foreground font-medium">{wh.manager}</span></span>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{wh.phone}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Warehouse</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Warehouse Name *', key: 'name', placeholder: 'e.g. Main Warehouse' },
              { label: 'Location *', key: 'location', placeholder: 'Full address' },
              { label: 'Capacity (units)', key: 'capacity', placeholder: '10000' },
              { label: 'Manager', key: 'manager', placeholder: 'Manager name' },
              { label: 'Phone', key: 'phone', placeholder: '+92-21-XXXXXXX' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input className="mt-1.5" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={addWH} className="flex-1">Add Warehouse</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
