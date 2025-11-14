// Environment configuration from Vite
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || '',
  PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL || window.location.origin,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;