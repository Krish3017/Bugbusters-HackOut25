# Database Setup Guide

## Quick Fix for Database Issues

Follow these steps to fix all database connection issues:

### Step 1: Access Your Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (the one with URL: `atlfvjzczurrvkghoizb.supabase.co`)

### Step 2: Run the Database Setup Script

1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste the entire contents of the file `fix-all-database-issues.sql`
4. Click **"Run"** to execute the script

### Step 3: Verify the Setup

After running the script, you should see:
- ✅ 5 test reports created
- ✅ 1 admin user created
- ✅ Storage bucket configured
- ✅ Award points function working
- ✅ All database policies set up

### Step 4: Test the Application

1. Refresh your application
2. Sign in with your account
3. You should now see:
   - Reports in the admin panel
   - Ability to approve/reject reports
   - Points being awarded when reports are verified

### What the Script Fixes

- **Storage Bucket**: Creates the "incident-photos" bucket for storing report images
- **Award Points Function**: Creates the function that awards points when reports are verified
- **Database Tables**: Creates profiles and reports tables if they don't exist
- **Security Policies**: Sets up proper permissions for admin users
- **Test Data**: Creates 5 sample reports for testing
- **Admin User**: Makes the first user an admin automatically

### If You Still Have Issues

1. Check the browser console for any error messages
2. Make sure you're signed in to the application
3. Try refreshing the page after running the script
4. Check that your Supabase project URL and API keys are correct in the environment variables

### Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```
VITE_SUPABASE_URL=https://atlfvjzczurrvkghoizb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_anon_key_here` with your actual Supabase anon key from the API settings.
