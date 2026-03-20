-- Update Supabase Auth Redirect URLs for leasemynd.com
-- Run this in Supabase SQL Editor

-- Update the site URL (main redirect after signup/login)
UPDATE auth.config
SET site_url = 'https://leasemynd.com';

-- Add additional redirect URLs (for OAuth, magic links, etc.)
-- This allows redirects to both production and common development URLs
UPDATE auth.config
SET additional_redirect_urls = ARRAY[
    'https://leasemynd.com',
    'https://leasemynd.com/dashboard',
    'https://leasemynd.com/login',
    'https://leasemynd.com/signup',
    'https://www.leasemynd.com',
    'https://www.leasemynd.com/dashboard',
    'https://www.leasemynd.com/login',
    'https://www.leasemynd.com/signup'
];

-- Verify the changes
SELECT site_url, additional_redirect_urls FROM auth.config;
