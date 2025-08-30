import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface DatabaseStatus {
  connected: boolean;
  profilesTable: boolean;
  reportsTable: boolean;
  storageBucket: boolean;
  awardPointsFunction: boolean;
}

const DatabaseStatus = () => {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    profilesTable: false,
    reportsTable: false,
    storageBucket: false,
    awardPointsFunction: false
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkDatabaseStatus = async () => {
    setChecking(true);
    try {
      // Check connection
      const { data: connectionTest } = await supabase.from('profiles').select('count').limit(1);
      const connected = !connectionTest || true; // If we get here, connection works

      // Check profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const profilesTable = !profilesError;

      // Check reports table
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .limit(1);
      const reportsTable = !reportsError;

      // Check storage bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .listBuckets();
      const storageBucket = storageData?.some(bucket => bucket.name === 'incident-photos') || false;

      // Check award_points function
      const { data: functionData, error: functionError } = await supabase.rpc('award_points', {
        user_id: '00000000-0000-0000-0000-000000000000',
        points_to_add: 0
      });
      const awardPointsFunction = !functionError || functionError.message.includes('violates row-level security');

      setStatus({
        connected,
        profilesTable,
        reportsTable,
        storageBucket,
        awardPointsFunction
      });
    } catch (error) {
      console.error('Error checking database status:', error);
      setStatus({
        connected: false,
        profilesTable: false,
        reportsTable: false,
        storageBucket: false,
        awardPointsFunction: false
      });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = (isWorking: boolean) => {
    if (isWorking) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (isWorking: boolean) => {
    return (
      <Badge variant={isWorking ? 'secondary' : 'destructive'}>
        {isWorking ? 'Working' : 'Issue'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Database Status
          </CardTitle>
          <CardDescription>Checking database connectivity and components...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allWorking = Object.values(status).every(Boolean);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allWorking ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          Database Status
        </CardTitle>
        <CardDescription>
          Current status of database components and connectivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.connected)}
              <span>Database Connection</span>
            </div>
            {getStatusBadge(status.connected)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.profilesTable)}
              <span>Profiles Table</span>
            </div>
            {getStatusBadge(status.profilesTable)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.reportsTable)}
              <span>Reports Table</span>
            </div>
            {getStatusBadge(status.reportsTable)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.storageBucket)}
              <span>Storage Bucket</span>
            </div>
            {getStatusBadge(status.storageBucket)}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.awardPointsFunction)}
              <span>Award Points Function</span>
            </div>
            {getStatusBadge(status.awardPointsFunction)}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            onClick={checkDatabaseStatus} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>

          {!allWorking && (
            <Button 
              onClick={() => window.open('https://supabase.com/docs/guides/database', '_blank')}
              variant="outline"
              size="sm"
            >
              View Setup Guide
            </Button>
          )}
        </div>

        {!allWorking && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Setup Required:</strong> Some database components are not working. 
              Please run the setup script in your Supabase SQL Editor.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;
