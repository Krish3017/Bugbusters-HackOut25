import { supabase } from './client';

export class EmergencyDatabaseSetup {
  private static instance: EmergencyDatabaseSetup;
  private localData = {
    profiles: new Map<string, any>(),
    reports: [] as any[],
    stats: {
      totalReports: 0,
      pendingReports: 0,
      verifiedReports: 0,
      totalUsers: 0
    }
  };

  static getInstance(): EmergencyDatabaseSetup {
    if (!EmergencyDatabaseSetup.instance) {
      EmergencyDatabaseSetup.instance = new EmergencyDatabaseSetup();
    }
    return EmergencyDatabaseSetup.instance;
  }

  // Simple initialization without async operations
  initializeDatabase(): void {
    console.log('Emergency database initialized');
    
    // Create test data immediately
    this.createTestData();
  }

  private createTestData(): void {
    // Create test reports if none exist
    if (this.localData.reports.length === 0) {
      console.log('Creating test reports...');
      
      const testReports = [
        {
          id: '1',
          title: 'Mangrove Deforestation',
          description: 'Large area of mangroves being cleared for development',
          status: 'pending',
          user_id: 'test-user',
          latitude: 12.9716,
          longitude: 77.5946,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: { full_name: 'Admin User' }
        },
        {
          id: '2',
          title: 'Oil Spill in Coastal Area',
          description: 'Oil spill affecting marine life and mangroves',
          status: 'pending',
          user_id: 'test-user',
          latitude: 13.0827,
          longitude: 80.2707,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: { full_name: 'Admin User' }
        },
        {
          id: '3',
          title: 'Plastic Pollution',
          description: 'Heavy plastic waste accumulation in mangrove area',
          status: 'pending',
          user_id: 'test-user',
          latitude: 19.0760,
          longitude: 72.8777,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: { full_name: 'Admin User' }
        },
        {
          id: '4',
          title: 'Illegal Fishing',
          description: 'Commercial fishing vessels in protected mangrove zone',
          status: 'pending',
          user_id: 'test-user',
          latitude: 22.5726,
          longitude: 88.3639,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: { full_name: 'Admin User' }
        },
        {
          id: '5',
          title: 'Water Pollution',
          description: 'Industrial waste being discharged near mangrove forest',
          status: 'pending',
          user_id: 'test-user',
          latitude: 17.3850,
          longitude: 78.4867,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_profile: { full_name: 'Admin User' }
        }
      ];

      this.localData.reports = testReports;
      this.updateStats();
      console.log('Test reports created');
    }
  }

  private updateStats(): void {
    this.localData.stats = {
      totalReports: this.localData.reports.length,
      pendingReports: this.localData.reports.filter(r => r.status === 'pending').length,
      verifiedReports: this.localData.reports.filter(r => r.status === 'verified').length,
      totalUsers: this.localData.profiles.size || 1
    };
  }

  // Simple synchronous operations
  getReports(): any[] {
    this.initializeDatabase();
    return this.localData.reports;
  }

  getUserReports(userId: string): any[] {
    this.initializeDatabase();
    return this.localData.reports.filter(r => r.user_id === userId || r.user_id === 'test-user');
  }

  getStats(): any {
    this.initializeDatabase();
    return this.localData.stats;
  }

  getUserProfile(userId: string): any {
    this.initializeDatabase();
    
    // Return a default admin profile
    return {
      id: userId,
      full_name: 'Admin User',
      role: 'authority',
      points: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  createReport(reportData: any): any {
    this.initializeDatabase();
    
    const newReport = {
      id: Date.now().toString(),
      ...reportData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: { full_name: 'Admin User' }
    };

    this.localData.reports.unshift(newReport);
    this.updateStats();
    
    return newReport;
  }

  updateReportStatus(reportId: string, newStatus: string): void {
    this.initializeDatabase();
    
    const report = this.localData.reports.find(r => r.id === reportId);
    if (report) {
      report.status = newStatus;
      report.updated_at = new Date().toISOString();
      this.updateStats();
    }
  }

  createUserProfile(userId: string, fullName?: string): void {
    this.initializeDatabase();
    
    const profile = {
      id: userId,
      full_name: fullName || 'User',
      role: 'community',
      points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.localData.profiles.set(userId, profile);
    this.updateStats();
  }
}

export const emergencyDatabaseSetup = EmergencyDatabaseSetup.getInstance();
