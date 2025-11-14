import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';

// Create Supabase admin client for server-side operations
export const supabaseAdmin = ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Alias for architect's naming convention
export const supaAdmin = supabaseAdmin;

// Create Supabase anon client for client-safe operations
export const supabaseAnon = ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Alias for architect's naming convention
export const supaAnon = supabaseAnon;