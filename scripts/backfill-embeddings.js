require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function backfill() {
  console.log('Starting embedding backfill...');
  
  const { data: items, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .is('embedding', null);

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Found ${items.length} items without embeddings.`);

  for (const item of items) {
    const embedString = `Category: ${item.category}, Sub-category: ${item.sub_category}, Color: ${item.primary_color}, Pattern: ${item.pattern}, Material: ${item.material}, Formality: ${item.formality_score}, Tags: ${(item.ai_tags || []).join(', ')}`;
    
    console.log(`Generating embedding for item ${item.id}...`);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: embedString,
      });

      const embedding = response.data[0].embedding;

      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({ embedding })
        .eq('id', item.id);

      if (updateError) {
        console.error(`Failed to update item ${item.id}:`, updateError);
      } else {
        console.log(`Successfully updated item ${item.id}`);
      }
    } catch (e) {
      console.error(`Error with OpenAI for item ${item.id}:`, e);
    }
    
    // Slight delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('Backfill complete!');
}

backfill();
