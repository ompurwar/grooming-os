-- Add multi-pass state tracking columns to outfits
ALTER TABLE outfits 
ADD COLUMN vto_passes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN vto_current_pass INTEGER DEFAULT 0;
