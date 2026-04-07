import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vqmbzltqhasiqiskakro.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbWJ6bHRxaGFzaXFpc2tha3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzY3MzYsImV4cCI6MjA5MTExMjczNn0.Wi-uTH9xlMrBhAdvkaXb1QZJDFcFIXfGeLd97_7akFQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
