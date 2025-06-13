import { createClient } from '@supabase/supabase-js'
export const supabaseUrl = "https://gxxhhxviijgjotogcmhn.supabase.co"
export const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eGhoeHZpaWpnam90b2djbWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MTQ3MzcsImV4cCI6MjA2NTM5MDczN30.5K61NkogavdyEAPSFbz0g9KkjFc3tDBWHpsPh3YLI7k"


export const supabase = createClient(supabaseUrl, supabaseKey)