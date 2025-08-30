import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings, Trophy, FileText, Map, BarChart3, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl">🌱</span>
          <span className="font-bold text-xl">Mangrove Watch</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-6">
            {profile?.role === 'authority' ? (
              // Admin navigation - only show admin-specific options
              <>
                <Link 
                  to="/admin" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/admin') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
                <Link 
                  to="/analytics" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/analytics') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Report Analysis</span>
                </Link>
              </>
            ) : (
              // Regular user navigation
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/dashboard') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/reports" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/reports') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>My Reports</span>
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    isActive('/leaderboard') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}
          </div>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {profile && (
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3" />
                    <span>{profile.points} pts</span>
                  </Badge>
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <Badge variant="outline" className="w-fit">
                        {profile?.role || 'Community'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;