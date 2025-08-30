import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface ReportData {
  id: string;
  status: string;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface TimeSeriesData {
  date: string;
  reports: number;
  verified: number;
  resolved: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const { profile } = useAuth();
  
  // ProtectedRoute now handles admin access control
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDistribution = (): ChartData[] => {
    const statusCounts = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: getStatusColor(status)
    }));
  };

  const getTimeSeriesData = (): TimeSeriesData[] => {
    const now = new Date();
    const data: TimeSeriesData[] = [];
    
    let days: number;
    let interval: number;
    
    switch (timeframe) {
      case 'week':
        days = 7;
        interval = 1;
        break;
      case 'month':
        days = 30;
        interval = 1;
        break;
      case 'year':
        days = 365;
        interval = 7;
        break;
      default:
        days = 30;
        interval = 1;
    }

    for (let i = days; i >= 0; i -= interval) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReports = reports.filter(report => 
        report.created_at.startsWith(dateStr)
      );
      
      data.push({
        date: dateStr,
        reports: dayReports.length,
        verified: dayReports.filter(r => r.status === 'verified').length,
        resolved: dayReports.filter(r => r.status === 'resolved').length
      });
    }

    return data;
  };

  const getLocationData = (): ChartData[] => {
    const locationCounts = reports.reduce((acc, report) => {
      if (report.latitude && report.longitude) {
        const key = `${report.latitude.toFixed(2)},${report.longitude.toFixed(2)}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({
        name: location,
        value: count
      }));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'verified':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'resolved':
        return '#3B82F6';
      default:
        return '#6B7280';
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

  const getStatusColorVariant = (status: string) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusDistribution = getStatusDistribution();
  const timeSeriesData = getTimeSeriesData();
  const locationData = getLocationData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Report Analysis</h1>
        <p className="text-muted-foreground">Insights into environmental incident patterns and trends</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reports.filter(r => r.status === 'verified').length / reports.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reports.filter(r => r.status === 'resolved').length / reports.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.latitude && r.longitude).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((reports.filter(r => r.latitude && r.longitude).length / reports.length) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Report Trends Over Time
            </CardTitle>
            <CardDescription>Number of reports submitted over the selected timeframe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#3B82F6" />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              ) : (
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="reports" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="verified" stackId="2" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="resolved" stackId="3" stroke="#8B5CF6" fill="#8B5CF6" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Report Status Distribution
            </CardTitle>
            <CardDescription>Breakdown of reports by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Heatmap */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Incident Hotspots
          </CardTitle>
          <CardDescription>Areas with the highest concentration of reported incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {['pending', 'verified', 'rejected', 'resolved'].map((status) => (
              <div key={status} className="flex items-center gap-2">
                <Badge variant={getStatusColorVariant(status)} className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  <span className="capitalize">{status}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {reports.filter(r => r.status === status).length} reports
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
