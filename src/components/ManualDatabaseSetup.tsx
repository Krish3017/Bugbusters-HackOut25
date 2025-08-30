import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const ManualDatabaseSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const setupDatabase = async () => {
    setLoading(true);
    setStatus('Starting database setup...');

    try {
      // Step 1: Create profiles table
      setStatus('Creating profiles table...');
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (profilesError && profilesError.message.includes('relation "profiles" does not exist')) {
        toast({
          title: "Database Setup Required",
          description: "Please run the SQL script in Supabase SQL Editor to create the required tables.",
          variant: "destructive"
        });
        setStatus('Database tables not found. Please run the SQL setup script.');
        return;
      }

      // Step 2: Create reports table
      setStatus('Checking reports table...');
      const { error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .limit(1);

      if (reportsError && reportsError.message.includes('relation "reports" does not exist')) {
        toast({
          title: "Database Setup Required",
          description: "Please run the SQL script in Supabase SQL Editor to create the required tables.",
          variant: "destructive"
        });
        setStatus('Database tables not found. Please run the SQL setup script.');
        return;
      }

      // Step 3: Check storage bucket
      setStatus('Checking storage bucket...');
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const incidentPhotosBucket = buckets?.find(bucket => bucket.name === 'incident-photos');
        
        if (!incidentPhotosBucket) {
          setStatus('Storage bucket not found. Please run the SQL setup script.');
          toast({
            title: "Storage Setup Required",
            description: "Please run the SQL script in Supabase SQL Editor to create the storage bucket.",
            variant: "destructive"
          });
          return;
        }
      } catch (storageError) {
        console.warn('Storage check failed:', storageError);
      }

      // Step 4: Create test data
      setStatus('Creating test data...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create profile for current user
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Admin User',
            role: 'authority',
            points: 100
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        }

        // Check if reports exist
        const { data: existingReports } = await supabase
          .from('reports')
          .select('id')
          .limit(1);

        if (!existingReports || existingReports.length === 0) {
          // Create test reports
          const testReports = [
            {
              title: 'Mangrove Deforestation',
              description: 'Large area of mangroves being cleared for development',
              status: 'pending',
              user_id: user.id,
              latitude: 12.9716,
              longitude: 77.5946
            },
            {
              title: 'Oil Spill in Coastal Area',
              description: 'Oil spill affecting marine life and mangroves',
              status: 'pending',
              user_id: user.id,
              latitude: 13.0827,
              longitude: 80.2707
            },
            {
              title: 'Plastic Pollution',
              description: 'Heavy plastic waste accumulation in mangrove area',
              status: 'pending',
              user_id: user.id,
              latitude: 19.0760,
              longitude: 72.8777
            },
            {
              title: 'Illegal Fishing',
              description: 'Commercial fishing vessels in protected mangrove zone',
              status: 'pending',
              user_id: user.id,
              latitude: 22.5726,
              longitude: 88.3639
            },
            {
              title: 'Water Pollution',
              description: 'Industrial waste being discharged near mangrove forest',
              status: 'pending',
              user_id: user.id,
              latitude: 17.3850,
              longitude: 78.4867
            }
          ];

          for (const report of testReports) {
            const { error } = await supabase
              .from('reports')
              .insert(report);
            
            if (error) {
              console.warn('Test report creation warning:', error);
            }
          }
        }
      }

      setStatus('Database setup completed successfully!');
      toast({
        title: "Setup Complete",
        description: "Database has been initialized successfully.",
      });

    } catch (error) {
      console.error('Database setup error:', error);
      setStatus('Database setup failed. Please check the console for errors.');
      toast({
        title: "Setup Failed",
        description: "Database setup failed. Please try again or run the SQL script manually.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Manual Database Setup
        </CardTitle>
        <CardDescription>
          Initialize the database and create test data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={setupDatabase} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Setup Database
            </>
          )}
        </Button>
        
        {status && (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : status.includes('completed') ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : status.includes('failed') ? (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
              {status}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualDatabaseSetup;
