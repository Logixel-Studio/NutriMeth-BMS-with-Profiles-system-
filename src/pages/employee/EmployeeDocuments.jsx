import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useMyDocuments, useUploadDocument } from '@/hooks/useEmployeeDocuments';
import { FileText, Upload, CheckCircle, Clock, XCircle, Shield, Download, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DOC_TYPES = ['CNIC','Passport','Contract','Experience Letter','Degree/Certificate','Joining Letter','Salary Slip','Bank Account Letter','Medical Certificate','Other'];

const STATUS_ST = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const STATUS_ICON = { pending: Clock, approved: CheckCircle, verified: Shield, rejected: XCircle };

export default function EmployeeDocuments() {
  const { data: docs = [], isLoading } = useMyDocuments();
  const upload = useUploadDocument();
  const fileRef = useRef();
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ doc_type: 'CNIC', description: '', file: null });

  const handleFileChange = (e) => setForm(p => ({ ...p, file: e.target.files[0] }));

  const handleUpload = async () => {
    if (!form.file) return;
    await upload.mutateAsync({ file: form.file, doc_type: form.doc_type, description: form.description });
    setForm({ doc_type: 'CNIC', description: '', file: null });
    setShowUpload(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <PageHeader title="My Documents" description="Upload and track your employment documents">
        <Button onClick={() => setShowUpload(true)}><Plus className="w-4 h-4 mr-2" />Upload Document</Button>
      </PageHeader>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}

      {!isLoading && docs.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-foreground mb-1">No documents uploaded</p>
          <p className="text-sm text-muted-foreground mb-4">Upload your CNIC, contracts, certificates and other documents</p>
          <Button onClick={() => setShowUpload(true)}><Upload className="w-4 h-4 mr-2" />Upload Now</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc, i) => {
          const Icon = STATUS_ICON[doc.status] || Clock;
          return (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', STATUS_ST[doc.status])}>
                  {doc.status}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{doc.doc_type}</h3>
              {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{doc.file_name}</p>
              {doc.admin_notes && (
                <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded-lg italic">Admin: {doc.admin_notes}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => window.open(doc.file_url, '_blank')}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Document Type</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(p => ({ ...p, doc_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input className="mt-1.5" placeholder="e.g. Original CNIC scan, front and back" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>File *</Label>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
              {form.file && <p className="text-xs text-muted-foreground mt-1">Selected: {form.file.name} ({(form.file.size / 1024).toFixed(1)} KB)</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpload} disabled={!form.file || upload.isPending} className="flex-1">
                {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" />Upload</>}
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
