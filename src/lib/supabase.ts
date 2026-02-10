import { createClient } from '@supabase/supabase-js'

// Estas variables leen automáticamente lo que pusiste en tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Exportamos el cliente para usarlo en toda la app
export const supabase = createClient(supabaseUrl, supabaseKey)