import { createClient } from '@supabase/supabase-js'

// These come from your .env file (we will set it next)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)