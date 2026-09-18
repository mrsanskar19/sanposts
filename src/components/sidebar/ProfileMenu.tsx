'use client';

import { useAuth } from '@/modules/auth';
import { UserProfile } from '@/types';
import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileMenuProps {
  user: UserProfile;
  onOpenSettings: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onOpenSettings }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  return (
    <div className="p-2 border-t border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left focus:outline-none"
        >
          <div className="relative shrink-0">
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 text-white flex items-center justify-center text-xs font-bold border border-zinc-300 dark:border-zinc-700 overflow-hidden shadow-xs">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user?.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name.charAt(0)}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50 truncate">
                {user?.name}
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold tracking-tight rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/80 dark:border-zinc-700/80">
                {user?.plan}
              </span>
            </div>
            
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Preferences"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 hover:bg-zinc-300/40 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
