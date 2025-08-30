# Tide Guard Collective - Setup Guide

## 🚀 Quick Start

### 1. **Database Setup (Required)**

Go to your **Supabase Dashboard** → **SQL Editor** and run the complete setup script:

```sql
-- Copy and paste the entire contents of setup-database.sql
-- This will create all necessary tables, functions, and policies
```

**Or run these commands one by one:**

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'community' CHECK (role IN ('community', 'authority')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;
```

### 2. **Environment Variables**

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. **Install Dependencies**

```bash
npm install
# or
yarn install
# or
bun install
```

### 4. **Run the Application**

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

## 🔧 **Admin Access Setup**

### **Admin Secret Key Configuration**

The admin secret key is configured in `src/config/admin.ts`. By default, it's set to:
```
TIDE_GUARD_2024
```

**To change the secret key:**
1. Edit `src/config/admin.ts`
2. Change the `SECRET_KEY` value
3. Restart your application

### **Creating Admin Accounts**

1. **During Signup:**
   - Select "Authority/Admin" as Account Type
   - Enter the admin secret key
   - Complete the signup process

2. **Existing Users:**
   - Login with your existing account
   - Select "Authority/Admin" as Account Type
   - Enter the admin secret key
   - Your role will be updated automatically

### **Security Notes**

- The admin secret key should be kept confidential
- Only share the secret key with trusted administrators
- Consider changing the default secret key in production
- Admin accounts have full access to all reports and analytics

## 📱 **Features Available**

### **For All Users:**
- ✅ **Dashboard** - View stats and recent reports
- ✅ **Report Incident** - Submit environmental incidents
- ✅ **My Reports** - Track your submitted reports
- ✅ **Leaderboard** - See top environmental guardians

### **For Admin Users (Authority Role):**
- ✅ **Admin Dashboard** - Manage all reports
- ✅ **Analytics** - View trends and patterns
- ✅ **Report Verification** - Verify/reject/resolve reports
- ✅ **Points Management** - Award points to users

## 🐛 **Troubleshooting**

### **Report Form Won't Submit:**
- Check browser console for errors
- Ensure database tables exist
- Verify storage bucket is created

### **Can't Access Admin Panel:**
- Use the Role Switcher in the Admin Dashboard
- Check if your user has 'authority' role
- Verify database policies are set correctly

### **Photos Not Uploading:**
- Check if storage bucket 'incident-photos' exists
- Verify storage policies are set
- Check file size (max 5MB)

### **Database Connection Issues:**
- Verify Supabase credentials in `.env.local`
- Check if your Supabase project is active
- Ensure RLS policies are configured correctly

## 🔒 **Security Notes**

- **Row Level Security (RLS)** is enabled by default
- Users can only see their own reports
- Admins can see and manage all reports
- Photo uploads are restricted to authenticated users
- Role changes should be restricted in production

## 📊 **Database Schema**

### **profiles table:**
- `id` - User ID (UUID, Primary Key)
- `full_name` - User's full name
- `role` - 'community' or 'authority'
- `points` - Gamification points
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### **reports table:**
- `id` - Report ID (UUID, Primary Key)
- `title` - Incident title
- `description` - Detailed description
- `photo_url` - Photo storage URL
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `status` - 'pending', 'verified', 'rejected', 'resolved'
- `user_id` - Reporter's user ID
- `created_at` - Report creation timestamp
- `updated_at` - Last update timestamp

## 🎯 **Next Steps**

1. **Test the application** with sample data
2. **Customize the UI** to match your brand
3. **Set up email notifications** for report submissions
4. **Configure mobile app** if needed
5. **Set up monitoring** and analytics

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Verify database setup is complete
3. Check Supabase project status
4. Review the troubleshooting section above

---

**Happy Environmental Monitoring! 🌱🌍**
