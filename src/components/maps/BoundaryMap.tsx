import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Check, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Set your Mapbox access token here
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token';

interface BoundaryMapProps {
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  /** Required unless the map is read-only. */
  onBoundariesChange?: (boundaries: GeoJSON.Polygon | null) => void;
  existingBoundaries?: GeoJSON.Polygon | null;
  readOnly?: boolean;
}

const BoundaryMap: React.FC<BoundaryMapProps> = ({
  initialCenter = [78.9629, 20.5937], // Default to central India
  initialZoom = 5,
  onBoundariesChange,
  existingBoundaries = null,
  readOnly = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [boundaries, setBoundaries] = useState<GeoJSON.Polygon | null>(existingBoundaries);

  // The map is built once per mount. Callers pass new arrays and callbacks on
  // every render (and existingBoundaries changes as the user draws), so these
  // are read through refs instead of being effect dependencies; otherwise the
  // whole map is torn down and rebuilt after every edit.
  const onChangeRef = useRef(onBoundariesChange);
  onChangeRef.current = onBoundariesChange;
  const initial = useRef({ center: initialCenter, zoom: initialZoom, boundaries: existingBoundaries });

  const report = (polygon: GeoJSON.Polygon | null) => {
    setBoundaries(polygon);
    onChangeRef.current?.(polygon);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    const { center, zoom, boundaries: startBoundaries } = initial.current;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom,
    });
    map.current = m;

    // Handle missing images (like "in-state-4") to prevent console errors
    m.on('styleimagemissing', (e) => {
      if (!m.hasImage(e.id)) {
        m.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    m.addControl(new mapboxgl.NavigationControl(), 'top-right');
    m.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    if (!readOnly) {
      const d = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      draw.current = d;
      m.addControl(d, 'top-left');

      const update = () => {
        const all = d.getAll();
        report(all.features.length > 0 ? (all.features[0].geometry as GeoJSON.Polygon) : null);
      };
      // Only one boundary is kept: drawing a new shape replaces the old one.
      m.on('draw.create', (e: { features: { id?: string | number }[] }) => {
        const keep = e.features[0]?.id;
        const others = d.getAll().features.map((f) => f.id).filter((id) => id !== keep);
        if (others.length > 0) d.delete(others as string[]);
        update();
      });
      m.on('draw.update', update);
      m.on('draw.delete', update);
    }

    m.on('load', () => {
      if (!startBoundaries) return;
      const feature = { type: 'Feature' as const, geometry: startBoundaries, properties: {} };
      if (!readOnly && draw.current) {
        draw.current.add(feature);
        return;
      }
      m.addSource('existing-boundaries', { type: 'geojson', data: feature });
      m.addLayer({
        id: 'existing-boundaries-fill',
        type: 'fill',
        source: 'existing-boundaries',
        paint: { 'fill-color': '#0080ff', 'fill-opacity': 0.5 },
      });
      m.addLayer({
        id: 'existing-boundaries-outline',
        type: 'line',
        source: 'existing-boundaries',
        paint: { 'line-color': '#0080ff', 'line-width': 2 },
      });
    });

    return () => {
      m.remove();
      map.current = null;
      draw.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // A read-only map follows changes to the boundary it shows.
  useEffect(() => {
    if (!readOnly || !existingBoundaries) return;
    const source = map.current?.getSource('existing-boundaries') as mapboxgl.GeoJSONSource | undefined;
    source?.setData({ type: 'Feature', geometry: existingBoundaries, properties: {} });
  }, [readOnly, existingBoundaries]);

  const clearBoundaries = () => {
    if (!draw.current) return;
    draw.current.deleteAll();
    report(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapContainer} className="w-full h-[350px]" />

          {!readOnly && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={clearBoundaries}
                disabled={!boundaries}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {!readOnly && !boundaries && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Boundary Required</AlertTitle>
            <AlertDescription>
              Please draw the farm boundaries on the map by using the polygon tool in the top left corner.
            </AlertDescription>
          </Alert>
        )}

        {!readOnly && boundaries && (
          <Alert variant="success" className="mt-2 bg-leaf-tint border-leaf/30 text-[#1A4D2C]">
            <Check className="h-4 w-4 text-leaf" />
            <AlertTitle>Boundaries Marked</AlertTitle>
            <AlertDescription>
              Farm boundaries have been successfully marked. You can edit them by dragging the points or clear and redraw.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BoundaryMap;
