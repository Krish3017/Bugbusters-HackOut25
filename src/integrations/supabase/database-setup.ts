import { supabase } from './client';

export class DatabaseSetup {
  private static instance: DatabaseSetup;
  private isInitialized = false;

  static getInstance(): DatabaseSetup {
    if (!DatabaseSetup.instance) {
      DatabaseSetup.instance = new DatabaseSetup();
    }
    return DatabaseSetup.instance;
  }

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing database...');
      
      // Create tables
      await this.createTables();
      
      // Create storage bucket
      await this.createStorageBucket();
      
      // Create functions
      await this.createFunctions();
      
      // Create policies
      await this.createPolicies();
      
      // Create test data if needed
      await this.createTestData();
      
      this.isInitialized = true;
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    console.log('Creating tables...');
    
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          full_name TEXT,
          role TEXT DEFAULT 'community' CHECK (role IN ('community', 'authority')),
          points INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (profilesError) {
      console.warn('Profiles table creation warning:', profilesError);
    }

    // Create reports table
    const { error: reportsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          photo_url TEXT,
          latitude DECIMAL,
          longitude DECIMAL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (reportsError) {
      console.warn('Reports table creation warning:', reportsError);
    }
  }

  private async createStorageBucket(): Promise<void> {
    console.log('Creating storage bucket...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('incident-photos', 'incident-photos', true)
        ON CONFLICT (id) DO NOTHING;
      `
    });

    if (error) {
      console.warn('Storage bucket creation warning:', error);
    }
  }

  private async createFunctions(): Promise<void> {
    console.log('Creating functions...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER)
        RETURNS VOID AS $$
        BEGIN
          UPDATE profiles 
          SET points = COALESCE(points, 0) + points_to_add,
              updated_at = NOW()
          WHERE id = user_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (error) {
      console.warn('Function creation warning:', error);
    }
  }

  private async createPolicies(): Promise<void> {
    console.log('Creating policies...');
    
    // Enable RLS on tables
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE reports ENABLE ROW LEVEL SECURITY;'
    });

    // Create policies using direct SQL execution
    const policies = [
      // Profiles policies
      'DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;',
      'CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);',
      'DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;',
      'CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);',
      'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;',
      'CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = \'authority\'));',
      
      // Reports policies
      'DROP POLICY IF EXISTS "Users can view their own reports" ON reports;',
      'CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = user_id);',
      'DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;',
      'CREATE POLICY "Users can insert their own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);',
      'DROP POLICY IF EXISTS "Users can update their own reports" ON reports;',
      'CREATE POLICY "Users can update their own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);',
      'DROP POLICY IF EXISTS "Admins can view all reports" ON reports;',
      'CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = \'authority\'));',
      'DROP POLICY IF EXISTS "Admins can update all reports" ON reports;',
      'CREATE POLICY "Admins can update all reports" ON reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = \'authority\'));',
      
      // Storage policies
      'DROP POLICY IF EXISTS "Users can upload incident photos" ON storage.objects;',
      'CREATE POLICY "Users can upload incident photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = \'incident-photos\' AND auth.uid() IS NOT NULL);',
      'DROP POLICY IF EXISTS "Users can view incident photos" ON storage.objects;',
      'CREATE POLICY "Users can view incident photos" ON storage.objects FOR SELECT USING (bucket_id = \'incident-photos\');',
      'DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;',
      'CREATE POLICY "Users can update their own photos" ON storage.objects FOR UPDATE USING (bucket_id = \'incident-photos\' AND auth.uid() IS NOT NULL);',
      'DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;',
      'CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (bucket_id = \'incident-photos\' AND auth.uid() IS NOT NULL);'
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec_sql', { sql: policy });
      } catch (error) {
        console.warn('Policy creation warning:', error);
      }
    }
  }

  private async createTestData(): Promise<void> {
    console.log('Creating test data...');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, skipping test data creation');
        return;
      }

      // Create profile for current user if it doesn't exist
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
    } catch (error) {
      console.warn('Test data creation warning:', error);
    }
  }

  async ensureUserProfile(userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            role: 'community',
            points: 0
          }, { onConflict: 'id' });
      }
    } catch (error) {
      console.warn('Profile creation warning:', error);
    }
  }
}

export const databaseSetup = DatabaseSetup.getInstance();
