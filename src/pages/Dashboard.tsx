import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { emergencyDatabaseSetup } from '@/integrations/supabase/emergency-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, AlertTriangle, CheckCircle, Clock, Shield, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  created_at: string;
  latitude?: number;
  longitude?: number;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    verifiedReports: 0,
    userPoints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Ensure database is initialized
      emergencyDatabaseSetup.initializeDatabase();

      // Get reports from emergency setup
      const emergencyReports = emergencyDatabaseSetup.getUserReports(user.id);
      if (emergencyReports && emergencyReports.length > 0) {
        console.log('Using emergency reports for dashboard:', emergencyReports.length);
        setReports(emergencyReports.slice(0, 5));
        
        const totalReports = emergencyReports.length;
        const pendingReports = emergencyReports.filter(r => r.status === 'pending').length;
        const verifiedReports = emergencyReports.filter(r => r.status === 'verified').length;
        
        setStats({
          totalReports,
          pendingReports,
          verifiedReports,
          userPoints: profile?.points || 0
        });
        
        setLoading(false);
        return;
      }

      // Fallback to database
      const { data: userReports } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: allUserReports } = await supabase
        .from('reports')
        .select('status')
        .eq('user_id', user.id);

      if (userReports) setReports(userReports);
      
      if (allUserReports) {
        const totalReports = allUserReports.length;
        const pendingReports = allUserReports.filter(r => r.status === 'pending').length;
        const verifiedReports = allUserReports.filter(r => r.status === 'verified').length;
        
        setStats({
          totalReports,
          pendingReports,
          verifiedReports,
          userPoints: profile?.points || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'verified':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'resolved':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Guardian'}!</h1>
          <p className="text-muted-foreground mt-2">Monitor and protect our mangrove ecosystems</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/report')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Report Incident</span>
          </Button>
          {profile?.role === 'authority' && (
            <Button variant="outline" onClick={() => navigate('/admin')} className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Admin Panel</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">Reports submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedReports}</div>
            <p className="text-xs text-muted-foreground">Confirmed incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userPoints}</div>
            <p className="text-xs text-muted-foreground">Environmental guardian points</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your latest environmental incident reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">Start protecting the environment by reporting incidents</p>
              <Button onClick={() => navigate('/report')}>
                Create First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{report.title}</h4>
                      <Badge variant={getStatusColor(report.status)} className="flex items-center space-x-1">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      {report.latitude && report.longitude && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>Location recorded</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4 space-x-2">
                <Button variant="outline" onClick={() => navigate('/reports')}>
                  View All Reports
                </Button>
                <Button variant="outline" onClick={() => navigate('/leaderboard')}>
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;