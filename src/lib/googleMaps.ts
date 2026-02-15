let googleMapsPromise: Promise<typeof google> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Impossible de charger Google Maps')));
      // If already loaded, resolve immediately.
      if ((window as unknown as { google?: typeof google }).google?.maps) resolve();
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Impossible de charger Google Maps'));
    document.head.appendChild(s);
  });
}

export async function loadGoogleMaps(): Promise<typeof google> {
  if ((window as unknown as { google?: typeof google }).google?.maps) {
    return (window as unknown as { google: typeof google }).google;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Clé Google Maps manquante (VITE_GOOGLE_MAPS_API_KEY).');
  }

  if (!googleMapsPromise) {
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    googleMapsPromise = loadScript(src).then(() => {
      const g = (window as unknown as { google?: typeof google }).google;
      if (!g?.maps) throw new Error('Google Maps non disponible après chargement.');
      return g;
    });
  }

  return googleMapsPromise;
}

