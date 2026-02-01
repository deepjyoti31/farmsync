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
  onBoundariesChange: (boundaries: GeoJSON.Polygon | null) => void;
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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    });

    // Handle missing images (like "in-state-4") to prevent console errors
    map.current.on('styleimagemissing', (e) => {
      const id = e.id;
      if (!map.current?.hasImage(id)) {
        // Create a 1x1 transparent image
        const width = 1;
        const height = 1;
        const data = new Uint8Array(width * height * 4);
        map.current?.addImage(id, { width, height, data });
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      'top-right'
    );

    if (!readOnly) {
      // Initialize draw control
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
      });

      // Add draw controls
      map.current.addControl(draw.current, 'top-left');

      // Add event listeners for drawing
      map.current.on('draw.create', updateBoundaries);
      map.current.on('draw.update', updateBoundaries);
      map.current.on('draw.delete', () => {
        setBoundaries(null);
        onBoundariesChange(null);
      });
    }

    // Add existing boundaries if available
    map.current.on('load', () => {
      if (existingBoundaries && map.current) {
        if (!readOnly && draw.current) {
          // Add existing boundaries to draw control
          draw.current.add({
            type: 'Feature',
            geometry: existingBoundaries,
            properties: {},
          });
        } else {
          // Just display the boundaries without editing capability
          map.current.addSource('existing-boundaries', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: existingBoundaries,
              properties: {},
            },
          });

          map.current.addLayer({
            id: 'existing-boundaries-fill',
            type: 'fill',
            source: 'existing-boundaries',
            paint: {
              'fill-color': '#0080ff',
              'fill-opacity': 0.5,
            },
          });

          map.current.addLayer({
            id: 'existing-boundaries-outline',
            type: 'line',
            source: 'existing-boundaries',
            paint: {
              'line-color': '#0080ff',
              'line-width': 2,
            },
          });
        }
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [initialCenter, initialZoom, existingBoundaries, readOnly, onBoundariesChange]);

  const updateBoundaries = () => {
    if (!draw.current || !map.current) return;

    const data = draw.current.getAll();
    if (data.features.length > 0) {
      // Get the first polygon (we only allow one)
      const polygon = data.features[0].geometry as GeoJSON.Polygon;
      setBoundaries(polygon);
      onBoundariesChange(polygon);
    } else {
      setBoundaries(null);
      onBoundariesChange(null);
    }
  };

  const clearBoundaries = () => {
    if (!draw.current) return;
    draw.current.deleteAll();
    setBoundaries(null);
    onBoundariesChange(null);
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
          <Alert variant="success" className="mt-2 bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
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
