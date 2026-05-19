import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Briefcase, Plus, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const JOBS = [
  { id: 1, title: 'Sales Executive', dept: 'Sales', openings: 2, applicants: 14, status: 'active', posted: '2026-05-01' },
  { id: 2, title: 'Software Developer', dept: 'IT', openings: 1, applicants: 28, status: 'active', posted: '2026-04-25' },
  { id: 3, title: 'HR Assistant', dept: 'HR', openings: 1, applicants: 8, status: 'closed', posted: '2026-04-10' },
  { id: 4, title: 'Warehouse Supervisor', dept: 'Inventory', openings: 1, applicants: 5, status: 'active', posted: '2026-05-10' },
];

const APPLICANTS = [
  { id: 1, name: 'Zara Sheikh', job: 'Sales Executive', stage: 'Interview', score: 85, applied: '2026-05-12' },
  { id: 2, name: 'Kamran Malik', job: 'Software Developer', stage: 'Technical Test', score: 91, applied: '2026-05-08' },
  { id: 3, name: 'Nida Hassan', job: 'Sales Executive', stage: 'Shortlisted', score: 78, applied: '2026-05-14' },
  { id: 4, name: 'Asad Mehmood', job: 'Warehouse Supervisor', stage: 'Applied', score: 65, applied: '2026-05-16' },
];

const STAGE_STYLES = {
  'Applied': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Shortlisted': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Interview': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Technical Test': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Offered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Hiring() {
  return (
    <div>
      <PageHeader title="Hiring Management" description="Track job openings and applicant pipeline">
        <Button><Plus className="w-4 h-4 mr-2" /> Post New Job</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Job Openings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Active Job Openings</h3>
          <div className="space-y-3">
            {JOBS.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-3.5 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.dept} · {job.openings} opening{job.openings > 1 ? 's' : ''} · Posted {job.posted}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{job.applicants}</p>
                  <p className="text-xs text-muted-foreground">applicants</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${
                    job.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600'}`}>
                    {job.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Applicant Pipeline */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Applicant Pipeline</h3>
          <div className="space-y-3">
            {APPLICANTS.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 p-3.5 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {app.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.job}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-foreground">{app.score}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STAGE_STYLES[app.stage] || 'bg-gray-100 text-gray-600'}`}>
                    {app.stage}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
