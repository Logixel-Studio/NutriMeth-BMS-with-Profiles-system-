import { UserCircle, Mail, Clock, CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function CreatorBadge({ creatorName, creatorEmail, createdAt, updatedAt }) {
  if (!creatorName && !creatorEmail) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Record Info</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {creatorName && (
          <div className="flex items-center gap-1.5 text-xs">
            <UserCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Created by</span>
            <span className="font-medium text-foreground">{creatorName}</span>
          </div>
        )}
        {creatorEmail && (
          <div className="flex items-center gap-1.5 text-xs">
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">{creatorEmail}</span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium text-foreground">{formatDate(createdAt)}</span>
          </div>
        )}
        {updatedAt && updatedAt !== createdAt && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Updated</span>
            <span className="font-medium text-foreground">{formatDate(updatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
