export const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }