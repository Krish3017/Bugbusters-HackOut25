import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Star, Crown, Award, TrendingUp } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  full_name: string;
  points: number;
  verified_reports: number;
  total_reports: number;
  rank: number;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          points,
          reports!inner(
            id,
            status,
            created_at
          )
        `)
        .order('points', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const processedUsers = data.map((user, index) => {
          const verifiedReports = user.reports.filter((r: any) => r.status === 'verified').length;
          const totalReports = user.reports.length;
          
          return {
            id: user.id,
            full_name: user.full_name || 'Anonymous Guardian',
            points: user.points || 0,
            verified_reports: verifiedReports,
            total_reports: totalReports,
            rank: index + 1
          };
        });

        setUsers(processedUsers);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (rank: number, points: number) => {
    if (rank === 1) {
      return { icon: <Crown className="h-5 w-5 text-yellow-500" />, text: "Champion 🏆", color: "bg-yellow-100 text-yellow-800" };
    } else if (rank === 2) {
      return { icon: <Medal className="h-5 w-5 text-gray-400" />, text: "Silver Guardian 🥈", color: "bg-gray-100 text-gray-800" };
    } else if (rank === 3) {
      return { icon: <Medal className="h-5 w-5 text-amber-600" />, text: "Bronze Protector 🥉", color: "bg-amber-100 text-amber-800" };
    } else if (points >= 100) {
      return { icon: <Star className="h-5 w-5 text-blue-500" />, text: "Eco Warrior 🌍", color: "bg-blue-100 text-blue-800" };
    } else if (points >= 50) {
      return { icon: <Award className="h-5 w-5 text-green-500" />, text: "Top Guardian 🌱", color: "bg-green-100 text-green-800" };
    } else if (points >= 20) {
      return { icon: <TrendingUp className="h-5 w-5 text-purple-500" />, text: "Rising Star ⭐", color: "bg-purple-100 text-purple-800" };
    } else {
      return { icon: <TrendingUp className="h-5 w-5 text-gray-500" />, text: "New Guardian 🌿", color: "bg-gray-100 text-gray-600" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Guardian Leaderboard</h1>
        <p className="text-muted-foreground">Celebrating our top environmental protectors</p>
      </div>

      {/* Timeframe Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTimeframe('all')}
          className={`px-4 py-2 rounded-md ${
            timeframe === 'all' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-md ${
            timeframe === 'month' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-md ${
            timeframe === 'week' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          This Week
        </button>
      </div>

      {/* Points System Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Points System
          </CardTitle>
          <CardDescription>How points are earned for environmental protection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+10</div>
              <div className="text-sm text-green-700">Verified Report</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">+2</div>
              <div className="text-sm text-blue-700">Participation</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">+5</div>
              <div className="text-sm text-purple-700">Quick Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <div className="space-y-3">
        {users.map((user) => {
          const badge = getBadge(user.rank, user.points);
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {user.rank}
                  </div>

                  {/* Avatar and Name */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={badge.color}>
                          {badge.icon}
                          <span className="ml-1">{badge.text}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{user.points}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>

                  {/* Report Stats */}
                  <div className="text-right hidden md:block">
                    <div className="text-sm">
                      <span className="font-medium">{user.verified_reports}</span> verified
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.total_reports} total reports
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground">
              Be the first to earn points and climb the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leaderboard;
