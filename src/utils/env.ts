
/**
 * Detects if the application is running within a Tauri (desktop) environment.
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI_IPC__ !== undefined;
};

/**
 * Detects if the application is running in "Local Mode" (Desktop) or "Cloud Mode" (Web).
 * Automatically falls back to local mode if Supabase environment variables are missing.
 */
export const getAppMode = (): 'local' | 'cloud' => {
  if (isTauri()) return 'local';
  
  // Check if Supabase keys are valid or just placeholders
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const mode = (!supabaseUrl || supabaseUrl.includes('placeholder')) ? 'local' : 'cloud';
  console.log(`[Env] App Mode Detected: ${mode} (${isTauri() ? 'Tauri' : 'Web'})`);
  return mode;
};
