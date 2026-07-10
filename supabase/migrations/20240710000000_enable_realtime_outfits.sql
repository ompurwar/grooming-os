-- Enable real-time for outfits table
BEGIN;
  -- Create the publication if it doesn't exist (Supabase usually manages this, but just in case)
  -- DO NOT create publication if you are using hosted Supabase, it exists by default.
  -- Add the table to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE outfits;
COMMIT;