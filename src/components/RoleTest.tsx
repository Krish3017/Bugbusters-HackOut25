import React from 'react';
import { useAuth } from './AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';

const RoleTest = () => {
  const { user, profile } = useAuth();

  if (!user) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Role Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-sm">Current Role:</span>
          <Badge variant={profile?.role === 'authority' ? 'secondary' : 'default'}>
            {profile?.role === 'authority' ? (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Authority
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Community
              </>
            )}
            {profile?.role || 'Unknown'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          User ID: {user.id}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleTest;
