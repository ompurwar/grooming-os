-- Add capsule_id to outfits table
ALTER TABLE public.outfits
ADD COLUMN capsule_id UUID REFERENCES public.capsules(id) ON DELETE SET NULL;

-- Allow users to update their own outfits with a capsule ID
-- Since outfits is already protected by:
-- CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id); -- wait, that's users table.
-- Wait, outfits doesn't have an UPDATE policy in 0000_init.sql! Let me add one for general update of outfits:

CREATE POLICY "Users can update own outfits"
ON public.outfits
FOR UPDATE USING (auth.uid() = user_id);
