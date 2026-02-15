import { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/googleMaps';

type MapDestination = {
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

interface TripMapProps {
  destinations: MapDestination[];
  className?: string;
}

export function TripMap({ destinations, className = '' }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const points = useMemo(
    () =>
      destinations
        .filter((d) => typeof d.latitude === 'number' && typeof d.longitude === 'number')
        .map((d) => ({
          label: `${d.city}, ${d.country}`,
          lat: d.latitude as number,
          lng: d.longitude as number,
        })),
    [destinations]
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      setError(null);
      if (!mapRef.current) return;
      if (points.length === 0) return;

      try {
        const g = await loadGoogleMaps();

        const map = new g.maps.Map(mapRef.current, {
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          clickableIcons: false,
          zoomControl: true,
        });

        const bounds = new g.maps.LatLngBounds();
        const markers: google.maps.Marker[] = [];

        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const pos = { lat: p.lat, lng: p.lng };
          bounds.extend(pos);

          const marker = new g.maps.Marker({
            position: pos,
            map,
            title: p.label,
            label: points.length > 1 ? String(i + 1) : undefined,
          });
          markers.push(marker);
        }

        if (points.length >= 2) {
          const line = new g.maps.Polyline({
            path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
            geodesic: true,
            strokeColor: '#26A56F',
            strokeOpacity: 0.85,
            strokeWeight: 3,
          });
          line.setMap(map);

          cleanup = () => {
            line.setMap(null);
            for (const m of markers) m.setMap(null);
          };
        } else {
          cleanup = () => {
            for (const m of markers) m.setMap(null);
          };
        }

        map.fitBounds(bounds, 48);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur Google Maps');
      }
    })();

    return () => cleanup?.();
  }, [points]);

  return (
    <div className={className}>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : points.length === 0 ? (
        <div className="rounded-xl border border-white/40 bg-white/40 p-4">
          <p className="text-sm text-gray-700">
            Ajoute une ou plusieurs étapes et localise-les pour afficher la carte.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-white/40 bg-white/40">
          <div ref={mapRef} className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}

