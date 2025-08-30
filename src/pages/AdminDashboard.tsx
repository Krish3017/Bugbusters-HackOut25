import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import DatabaseStatus from '@/components/DatabaseStatus';
import { emergencyDatabaseSetup } from '@/integrations/supabase/emergency-setup';
import ManualDatabaseSetup from '@/components/ManualDatabaseSetup';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  Search,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Map
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
  user_id: string;
  user_profile?: {
    full_name: string;
  };
}

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    verifiedReports: 0,
    resolvedReports: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [user, profile]);

  useEffect(() => {
    filterReports();
  }, [reports, statusFilter, searchTerm, dateFilter]);

  const fetchReports = async () => {
    try {
      console.log('Fetching reports...');
      console.log('Current user:', user?.id);
      console.log('Current profile:', profile);
      
      // First check if user is authenticated
      if (!user) {
        console.log('No user authenticated');
        setReports([]);
        setLoading(false);
        return;
      }

      // Ensure database is initialized
      emergencyDatabaseSetup.initializeDatabase();
      
      // Get reports from emergency setup
      const emergencyReports = emergencyDatabaseSetup.getReports();
      if (emergencyReports && emergencyReports.length > 0) {
        console.log('Using emergency reports:', emergencyReports.length);
        setReports(emergencyReports);
        setLoading(false);
        return;
      }
      
      // Fallback to database
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          user_profile:profiles!reports_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Reports fetch error:', error);
        
        // Check if it's a table not found error
        if (error.message.includes('relation "reports" does not exist')) {
          toast({
            title: "Database Setup Required",
            description: "Reports table not found. Please run the database setup script in Supabase SQL Editor.",
            variant: "destructive"
          });
        } else if (error.message.includes('JWT') || error.message.includes('authentication')) {
          toast({
            title: "Authentication Error",
            description: "Please sign in again to access admin features.",
            variant: "destructive"
          });
        } else if (error.message.includes('policy') || error.message.includes('permission')) {
          toast({
            title: "Permission Error",
            description: "You don't have admin permissions. Please check if you're logged in as an admin user.",
            variant: "destructive"
          });
        } else if (error.message.includes('connection') || error.message.includes('network')) {
          toast({
            title: "Connection Error",
            description: "Failed to connect to database. Please check your internet connection.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Database Error",
            description: `Error: ${error.message}. Please run the database setup script.`,
            variant: "destructive"
          });
        }
        
        setReports([]);
        return;
      }
      
      console.log('Reports fetched successfully:', data?.length || 0);
      console.log('Reports data:', data);
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to database. Please check your internet connection and try again.",
        variant: "destructive"
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      
      // Get stats from emergency setup
      const emergencyStats = emergencyDatabaseSetup.getStats();
      if (emergencyStats) {
        console.log('Using emergency stats:', emergencyStats);
        setStats({
          totalReports: emergencyStats.totalReports,
          pendingReports: emergencyStats.pendingReports,
          verifiedReports: emergencyStats.verifiedReports,
          resolvedReports: 0,
          totalUsers: emergencyStats.totalUsers
        });
        return;
      }
      
      // Fallback to database
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('status');

      if (reportError) {
        console.error('Error fetching report stats:', reportError);
        return;
      }

      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) {
        console.error('Error fetching user count:', userError);
      }

      if (reportData) {
        const totalReports = reportData.length;
        const pendingReports = reportData.filter(r => r.status === 'pending').length;
        const verifiedReports = reportData.filter(r => r.status === 'verified').length;
        const resolvedReports = reportData.filter(r => r.status === 'resolved').length;

        setStats({
          totalReports,
          pendingReports,
          verifiedReports,
          resolvedReports,
          totalUsers: userCount || 0
        });
        
        console.log('Stats updated:', { totalReports, pendingReports, verifiedReports, resolvedReports, totalUsers: userCount || 0 });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        
        switch (dateFilter) {
          case 'today':
            return reportDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return reportDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return reportDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      // Update in emergency setup first
      emergencyDatabaseSetup.updateReportStatus(reportId, newStatus);
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus as any }
          : report
      ));

      // If verifying a report, award points to the user
      if (newStatus === 'verified') {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          await awardPoints(report.user_id, 10);
        }
      }

      toast({
        title: "Status Updated",
        description: `Report marked as ${newStatus}`,
      });

      // Refresh stats
      fetchStats();
      
      // Try to update in database as well (but don't fail if it doesn't work)
      try {
        const { error } = await supabase
          .from('reports')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', reportId);
        
        if (error) {
          console.warn('Database update failed, but emergency update succeeded:', error);
        }
      } catch (dbError) {
        console.warn('Database update failed, but emergency update succeeded:', dbError);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive"
      });
    }
  };

  const awardPoints = async (userId: string, points: number) => {
    try {
      console.log(`Awarding ${points} points to user ${userId}`);
      
      // Try to use the RPC function first
      const { error: rpcError } = await supabase.rpc('award_points', {
        user_id: userId,
        points_to_add: points
      });

      if (rpcError) {
        console.warn('RPC function not found, using fallback method:', rpcError);
        
        // Fallback: manually update points if RPC function doesn't exist
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            points: supabase.sql`COALESCE(points, 0) + ${points}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating points:', updateError);
          toast({
            title: "Database Setup Required",
            description: "Award points function is not working. Please run the database setup script in Supabase SQL Editor.",
            variant: "destructive"
          });
          throw updateError;
        } else {
          console.log('Points awarded successfully using fallback method');
        }
      } else {
        console.log('Points awarded successfully using RPC function');
      }
      
      toast({
        title: "Points Awarded",
        description: `${points} points have been awarded to the user.`,
      });
      
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Points Award Error",
        description: "Failed to award points to user. Please check database setup and try again.",
        variant: "destructive"
      });
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

  // ProtectedRoute now handles admin access control

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage and review environmental incident reports</p>
      </div>

               {/* Database Status Checker - Show if there are issues or no reports */}
        {(reports.length === 0 && !loading) && (
          <div className="space-y-6">
            <DatabaseStatus />
            
            {/* Manual Database Setup */}
            <ManualDatabaseSetup />
            
            {/* Helpful message for no reports */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">No Reports Available</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      No environmental reports have been submitted yet. Use the setup button above to create test data, or run the database setup script manually.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/fix-all-database-issues.sql', '_blank')}
                    className="ml-auto"
                  >
                    View Setup Script
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedReports}</div>
            <p className="text-xs text-muted-foreground">Confirmed incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedReports}</div>
            <p className="text-xs text-muted-foreground">Action taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered guardians</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Management</CardTitle>
          <CardDescription>
            {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
                     {filteredReports.length === 0 ? (
             <div className="text-center py-12">
               <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-semibold mb-2">No reports found</h3>
               <p className="text-muted-foreground">
                 {reports.length === 0 
                   ? "No environmental reports have been submitted by users yet. Reports will appear here once users start submitting incidents." 
                   : "No reports match your current filters."}
               </p>
               {reports.length === 0 && (
                 <div className="mt-4">
                   <Button 
                     variant="outline" 
                     onClick={() => window.open('/report', '_blank')}
                   >
                     View Report Form
                   </Button>
                 </div>
               )}
             </div>
           ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{report.title}</h3>
                          <Badge variant={getStatusColor(report.status)} className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{report.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {report.user_profile?.full_name || 'Anonymous'}
                          </span>
                          {report.latitude && report.longitude && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location recorded
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {report.photo_url && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Photo
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{report.title}</DialogTitle>
                                <DialogDescription>
                                  Photo submitted by {report.user_profile?.full_name || 'Anonymous'}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <img
                                  src={report.photo_url}
                                  alt="Incident photo"
                                  className="w-full rounded-lg"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {report.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateReportStatus(report.id, 'verified')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateReportStatus(report.id, 'rejected')}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {report.status === 'verified' && (
                          <Button
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
