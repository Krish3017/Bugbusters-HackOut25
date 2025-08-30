import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, User, Loader2 } from 'lucide-react';

const AdminRoleSwitcher = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(profile?.role || 'community');

  const updateRole = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `Your role has been changed to ${selectedRole}. Please refresh the page.`,
      });

      // Force a page refresh to update the auth context
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management (Testing)
        </CardTitle>
        <CardDescription>
          Switch between community and authority roles for testing purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Current Role:</span>
            <Badge variant={profile?.role === 'authority' ? 'secondary' : 'default'}>
              {profile?.role || 'community'}
            </Badge>
          </div>
          
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="authority">Authority</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={updateRole} 
            disabled={loading || selectedRole === profile?.role}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a testing feature. In production, role changes should be 
            managed by administrators through proper security protocols.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Badge component for the role switcher
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    secondary: "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default}`}>
      {children}
    </span>
  );
};

export default AdminRoleSwitcher;
