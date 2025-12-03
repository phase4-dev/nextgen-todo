-- Migration: Add reflection and completed_at columns to todos table
-- Run this in your Supabase SQL Editor if your todos table already exists

-- Add reflection column if it doesn't exist
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS reflection TEXT;

-- Add completed_at column if it doesn't exist
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

