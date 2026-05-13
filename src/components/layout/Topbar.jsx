import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sun, Moon, Menu, UserCircle, LogOut, UsersRound } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';

export default function Topbar({ onMobileMenuToggle }) {
  const { theme, toggleTheme } = useTheme();
  const { user, displayName, logout } = useAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onMobileMenuToggle}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-foreground">NUTRIMETH BMS</h2>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <NotificationPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2 text-muted-foreground hover:text-foreground">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate text-foreground">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <UserCircle className="w-4 h-4 mr-2" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/team" className="cursor-pointer">
                <UsersRound className="w-4 h-4 mr-2" /> Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
