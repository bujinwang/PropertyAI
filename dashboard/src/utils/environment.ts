// Utility to safely access environment variables in Vite
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const nodeEnv = import.meta.env.MODE;

// For backward compatibility with process.env.NODE_ENV
export const getNodeEnv = () => import.meta.env.MODE;