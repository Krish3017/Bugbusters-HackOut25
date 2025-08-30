import { supabase } from './client';

export class SimpleDatabaseSetup {
  private static instance: SimpleDatabaseSetup;
  private isInitialized = false;

  static getInstance(): SimpleDatabaseSetup {
    if (!SimpleDatabaseSetup.instance) {
      SimpleDatabaseSetup.instance = new SimpleDatabaseSetup();
    }
    return SimpleDatabaseSetup.instance;
  }

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing database...');
      
      // Create user profile if needed
      await this.ensureUserProfile();
      
      // Create test data if needed
      await this.createTestData();
      
      this.isInitialized = true;
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async ensureUserProfile(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, skipping profile creation');
        return;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile for current user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Admin User',
            role: 'authority', // Make first user admin
            points: 100
          });

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        } else {
          console.log('Profile created successfully');
        }
      } else {
        // Update existing profile to ensure admin role
        if (existingProfile.role !== 'authority') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'authority', points: 100 })
            .eq('id', user.id);

          if (updateError) {
            console.warn('Profile update warning:', updateError);
          } else {
            console.log('Profile updated to admin role');
          }
        }
      }
    } catch (error) {
      console.warn('Profile creation warning:', error);
    }
  }

  private async createTestData(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, skipping test data creation');
        return;
      }

      // Check if reports exist
      const { data: existingReports } = await supabase
        .from('reports')
        .select('id')
        .limit(1);

      if (!existingReports || existingReports.length === 0) {
        console.log('Creating test reports...');
        
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
          } else {
            console.log('Test report created:', report.title);
          }
        }
      } else {
        console.log('Test reports already exist');
      }
    } catch (error) {
      console.warn('Test data creation warning:', error);
    }
  }

  async createUserProfile(userId: string, fullName?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName || 'User',
          role: 'community',
          points: 0
        }, { onConflict: 'id' });

      if (error) {
        console.warn('Profile creation warning:', error);
      } else {
        console.log('User profile created/updated');
      }
    } catch (error) {
      console.warn('Profile creation warning:', error);
    }
  }

  async makeUserAdmin(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'authority', points: 100 })
        .eq('id', userId);

      if (error) {
        console.warn('Admin role update warning:', error);
      } else {
        console.log('User made admin successfully');
      }
    } catch (error) {
      console.warn('Admin role update warning:', error);
    }
  }
}

export const simpleDatabaseSetup = SimpleDatabaseSetup.getInstance();
