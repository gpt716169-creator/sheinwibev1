import { createClient } from '@supabase/supabase-js';

// Возьми эти данные в Supabase -> Settings -> API
// Возьми эти данные в Supabase -> Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
