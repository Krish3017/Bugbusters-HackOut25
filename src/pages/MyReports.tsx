import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { emergencyDatabaseSetup } from '@/integrations/supabase/emergency-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Edit, 
  Eye, 
  Calendar,
  Filter,
  Search
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
}

const MyReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [reports, statusFilter, searchTerm]);

  const fetchReports = async () => {
    if (!user) return;

    try {
      // Ensure database is initialized
      emergencyDatabaseSetup.initializeDatabase();

      // Get reports from emergency setup
      const emergencyReports = emergencyDatabaseSetup.getUserReports(user.id);
      if (emergencyReports && emergencyReports.length > 0) {
        console.log('Using emergency reports for MyReports:', emergencyReports.length);
        setReports(emergencyReports);
        setLoading(false);
        return;
      }

      // Fallback to database
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your reports.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      description: report.description
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          title: editForm.title,
          description: editForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === editingReport.id 
          ? { ...report, title: editForm.title, description: editForm.description }
          : report
      ));

      toast({
        title: "Success",
        description: "Report updated successfully.",
      });

      setEditingReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report.",
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting review by authorities';
      case 'verified':
        return 'Incident confirmed and verified';
      case 'rejected':
        return 'Report was not accepted';
      case 'resolved':
        return 'Action has been taken to resolve';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Reports</h1>
        <p className="text-muted-foreground">Track all your environmental incident reports</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              {reports.length === 0 
                ? "You haven't submitted any reports yet." 
                : "No reports match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
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
                      {report.latitude && report.longitude && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location recorded
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {getStatusDescription(report.status)}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {report.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(report)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    
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
                              Photo taken on {new Date(report.created_at).toLocaleDateString()}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Update your report details. Only pending reports can be edited.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Report title"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setEditingReport(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyReports;
