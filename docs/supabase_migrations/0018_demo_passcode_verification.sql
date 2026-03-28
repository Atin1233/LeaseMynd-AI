-- Demo passcode verification column for profiles
-- Run in Supabase SQL Editor. Requires: profiles table.
-- This adds a column to track whether a user has entered the demo passcode.

-- Add the demo_passcode_verified column with default false for existing users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_passcode_verified BOOLEAN DEFAULT false;

-- Set existing profiles to have passcode verified (so existing users aren't blocked)
-- If you want existing users to be blocked, comment out this line:
UPDATE profiles SET demo_passcode_verified = true WHERE demo_passcode_verified = false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.demo_passcode_verified IS 'Whether the user has verified the demo passcode (dl245658) to access the application';

-- Create index for faster lookups on the passcode verification status
CREATE INDEX IF NOT EXISTS idx_profiles_demo_passcode_verified ON profiles(demo_passcode_verified);

-- Optional: Add a database function to check if user has verified passcode
CREATE OR REPLACE FUNCTION check_demo_passcode_verified(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_verified BOOLEAN;
BEGIN
    SELECT demo_passcode_verified INTO is_verified
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(is_verified, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
