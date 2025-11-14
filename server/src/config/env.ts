// Environment configuration with validation
export const ENV = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Server
  BFF_PORT: Number(process.env.BFF_PORT || 5177),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security - default to localhost in development
  APP_ORIGIN: process.env.APP_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || 
    (process.env.NODE_ENV === 'development' ? ['http://localhost:5000', 'http://localhost:5177'] : []),
  
  // Version
  GIT_SHA: process.env.GIT_SHA || 'dev',
  
  // Supabase (for future auth)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,
};

// Validate required env vars on startup
export function validateEnv() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}