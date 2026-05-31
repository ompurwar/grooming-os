-- Users Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  age_range TEXT,
  city TEXT,
  occupation TEXT,
  budget_range TEXT,
  subscription_tier TEXT DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Body Analysis
CREATE TABLE IF NOT EXISTS public.body_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body_type TEXT,
  height_estimate TEXT,
  shoulder_width TEXT,
  torso_ratio TEXT,
  build TEXT,
  fit_recommendations JSONB,
  raw_analysis JSONB,
  front_photo_url TEXT,
  side_photo_url TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Face Analysis
CREATE TABLE IF NOT EXISTS public.face_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  face_shape TEXT,
  skin_tone TEXT,
  undertone TEXT,
  color_palette JSONB,
  hair_type TEXT,
  hair_texture TEXT,
  facial_hair_status TEXT,
  wears_glasses BOOLEAN DEFAULT FALSE,
  raw_analysis JSONB,
  face_photo_url TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Style Preferences
CREATE TABLE IF NOT EXISTS public.style_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  style_archetype TEXT,
  liked_looks JSONB,
  disliked_looks JSONB,
  preferred_colors JSONB,
  avoided_colors JSONB,
  comfort_zones JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wardrobe Items
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  primary_color TEXT,
  secondary_colors JSONB,
  pattern TEXT,
  material TEXT,
  formality_score INT CHECK (formality_score BETWEEN 1 AND 5),
  seasons JSONB,
  condition TEXT DEFAULT 'good',
  brand TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  ai_tags JSONB,
  raw_analysis JSONB,
  added_at TIMESTAMPTZ DEFAULT now(),
  retired_at TIMESTAMPTZ
);

-- Outfits (Saved looks)
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  occasion TEXT,
  occasion_category TEXT,
  prompt_text TEXT,
  confidence_score FLOAT,
  reasoning TEXT,
  hairstyle_suggestion TEXT,
  grooming_notes TEXT,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  is_saved BOOLEAN DEFAULT FALSE,
  weather_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Marketplace Items (curated catalog)
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  primary_color TEXT,
  colors JSONB,
  pattern TEXT,
  material TEXT,
  formality_score INT,
  price_inr DECIMAL,
  brand TEXT,
  partner_url TEXT,
  image_url TEXT,
  versatility_score INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outfit Items (junction table)
CREATE TABLE IF NOT EXISTS public.outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  wardrobe_item_id UUID REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
  marketplace_item_id UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  slot TEXT NOT NULL,
  item_reasoning TEXT,
  is_marketplace_suggestion BOOLEAN DEFAULT FALSE
);

-- Outfit Wear History
CREATE TABLE IF NOT EXISTS public.outfit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  worn_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grooming Recommendations
CREATE TABLE IF NOT EXISTS public.grooming_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT,
  reference_image_url TEXT,
  visualization_url TEXT,
  confidence_score FLOAT,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Marketplace Recommendations (personalized per user)
CREATE TABLE IF NOT EXISTS public.marketplace_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  marketplace_item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  recommendation_type TEXT,
  reasoning TEXT,
  wardrobe_matches INT,
  related_outfit_id UUID REFERENCES public.outfits(id) ON DELETE SET NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- Policies for User Data (User can only read and write their own data)
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own body profile" ON public.body_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own face profile" ON public.face_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own style preferences" ON public.style_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own wardrobe items" ON public.wardrobe_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own outfits" ON public.outfits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own outfit history" ON public.outfit_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own grooming recommendations" ON public.grooming_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own marketplace recommendations" ON public.marketplace_recommendations FOR ALL USING (auth.uid() = user_id);

-- Outfit Items inherits visibility from outfits
CREATE POLICY "Users can view outfit items for their outfits" ON public.outfit_items 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid()));

-- Marketplace Items are public for read, restricted for write
CREATE POLICY "Marketplace items are public to view" ON public.marketplace_items FOR SELECT USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
