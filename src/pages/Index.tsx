import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            🌱 Community Mangrove Watch
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Protecting our coastal ecosystems through community monitoring and reporting
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 bg-card rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-semibold">Report Issues</h3>
            <p className="text-sm text-muted-foreground">Track environmental threats in real-time</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🌊</div>
            <h3 className="font-semibold">Monitor Impact</h3>
            <p className="text-sm text-muted-foreground">View community reports and take action</p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-sm border">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-semibold">Earn Recognition</h3>
            <p className="text-sm text-muted-foreground">Get points and badges for contributions</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button 
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started
          </button>
          <button 
            onClick={() => navigate('/auth')}
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;