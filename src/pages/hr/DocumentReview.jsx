import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useAllDocuments, useUpdateDocumentStatus } from '@/hooks/useEmployeeDocuments';
import { useState } from 'react';
import { FileText, CheckCircle, XCircle, Shield, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ST = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function DocumentReview() {
  const [filter, setFilter] = useState('all');
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState('');
  const { data: docs = [], isLoading } = useAllDocuments();
  const updateStatus = useUpdateDocumentStatus();

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

  const handleUpdate = async (status) => {
    await updateStatus.mutateAsync({ id: reviewing.id, status, notes });
    setReviewing(null);
    setNotes('');
  };

  return (
    <div>
      <PageHeader title="Document Review" description="Review and verify employee-uploaded documents">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </PageHeader>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Employee','Doc Type','File','Description','Status','Uploaded','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{doc.user_profiles?.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{doc.user_profiles?.department}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-foreground">{doc.doc_type}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.file_name}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground max-w-[160px] truncate">{doc.description || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', ST[doc.status])}>{doc.status}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(doc.file_url, '_blank')}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setReviewing(doc); setNotes(''); }}>
                        Review
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No documents</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review — {reviewing?.doc_type} ({reviewing?.user_profiles?.full_name})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.open(reviewing?.file_url, '_blank')}>
                <Eye className="w-4 h-4 mr-2" /> Preview File
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.open(reviewing?.file_url, '_blank')}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
            <div>
              <Label>Admin Notes (optional)</Label>
              <Input className="mt-1.5" placeholder="Add review notes…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button onClick={() => handleUpdate('approved')} disabled={updateStatus.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button onClick={() => handleUpdate('verified')} disabled={updateStatus.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white">
                <Shield className="w-4 h-4 mr-1" /> Verify
              </Button>
              <Button onClick={() => handleUpdate('rejected')} disabled={updateStatus.isPending} variant="destructive">
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setReviewing(null)} className="w-full">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
