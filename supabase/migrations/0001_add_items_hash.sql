-- Enable pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add the new items_hash column
ALTER TABLE outfits ADD COLUMN items_hash TEXT;

-- Create an index for fast duplicate checking
CREATE INDEX idx_outfits_items_hash ON outfits(user_id, items_hash) WHERE is_saved = true;

-- Backfill existing outfits with their items_hash
WITH outfit_hashes AS (
  SELECT 
    outfit_id, 
    encode(digest(string_agg(wardrobe_item_id::text, ',' ORDER BY wardrobe_item_id::text), 'sha256'), 'hex') as hash
  FROM outfit_items
  GROUP BY outfit_id
)
UPDATE outfits
SET items_hash = outfit_hashes.hash
FROM outfit_hashes
WHERE outfits.id = outfit_hashes.outfit_id;
