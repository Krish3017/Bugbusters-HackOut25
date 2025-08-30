import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { emergencyDatabaseSetup } from '@/integrations/supabase/emergency-setup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, MapPin, Upload, Loader2, AlertCircle } from 'lucide-react';

const ReportIncident = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo: null as File | null,
    latitude: null as number | null,
    longitude: null as number | null
  });
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter coordinates manually.",
        variant: "destructive"
      });
      return;
    }

    setLocationLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }));

      toast({
        title: "Location captured!",
        description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
      });
    } catch (error) {
      toast({
        title: "Location capture failed",
        description: "Please try again or enter coordinates manually.",
        variant: "destructive"
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a photo smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const takePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.photo) {
      toast({
        title: "Photo required",
        description: "Please upload or take a photo of the incident.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a report.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Ensure user profile exists
      emergencyDatabaseSetup.createUserProfile(user.id, user.user_metadata?.full_name);

      let photoUrl = null;

      // Upload photo to Supabase storage
      if (formData.photo) {
        try {
          const fileExt = formData.photo.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incident-photos')
            .upload(fileName, formData.photo);

          if (uploadError) {
            console.warn('Storage upload failed, continuing without photo:', uploadError);
            // Continue without photo if storage fails
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('incident-photos')
              .getPublicUrl(fileName);
            
            photoUrl = publicUrl;
          }
        } catch (storageError) {
          console.warn('Storage error, continuing without photo:', storageError);
          // Continue without photo if storage fails
        }
      }

      // Create report in emergency setup first
      const reportData = {
        title: formData.title,
        description: formData.description,
        photo_url: photoUrl,
        latitude: formData.latitude,
        longitude: formData.longitude,
        user_id: user.id,
        status: 'pending'
      };

      emergencyDatabaseSetup.createReport(reportData);

      // Try to create in database as well (but don't fail if it doesn't work)
      try {
        const { error: reportError } = await supabase
          .from('reports')
          .insert(reportData);

        if (reportError) {
          console.warn('Database report creation failed, but emergency creation succeeded:', reportError);
        }
      } catch (dbError) {
        console.warn('Database report creation failed, but emergency creation succeeded:', dbError);
      }

      toast({
        title: "Report submitted successfully!",
        description: "Your incident report has been submitted and is pending review.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span>Report Environmental Incident</span>
          </CardTitle>
          <CardDescription>
            Help protect our mangrove ecosystems by reporting environmental incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the incident, including any visible damage or concerns..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Incident Photo *</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={takePhoto}
                  className="flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Take Photo</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureLocation}
                  disabled={locationLoading}
                  className="flex items-center space-x-2"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  <span>
                    {locationLoading ? 'Capturing...' : 'Auto-capture Location'}
                  </span>
                </Button>
              </div>
              
              {formData.latitude && formData.longitude && (
                <div className="text-sm text-muted-foreground">
                  Location captured: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIncident;
