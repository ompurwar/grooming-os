-- Add VTO tracking columns
ALTER TABLE outfits ADD COLUMN vto_job_id TEXT;
ALTER TABLE outfits ADD COLUMN vto_status TEXT DEFAULT 'idle';
