import { useEffect, type FunctionComponent } from 'react';

import { latLngBounds, type LatLngTuple } from 'leaflet';
import { ImageOverlay, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import type { Coordinate, ParcelVegetation } from '../domaines.types';

// Tuiles satellite Google (`lyrs=s`) — mises en cache 30 j par le service worker
// (voir `vite.config.ts` → `map-tiles-google`) pour l'usage terrain hors-ligne.
const SATELLITE_URL = 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
const SATELLITE_SUBDOMAINS = ['0', '1', '2', '3'];

interface DomainMiniMapProps {
  /** Contour du domaine (sommets lat/lng). */
  contour: Coordinate[];
  /** Parcelles NDVI : chaque `tileUrl` devient un overlay raster. */
  parcels: ParcelVegetation[];
}

/** Cadre la carte sur le contour du domaine (impératif, via l'instance Leaflet). */
const FitContour: FunctionComponent<{ positions: LatLngTuple[] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(latLngBounds(positions), { padding: [6, 6], animate: false });
    }
  }, [map, positions]);
  return null;
};

/**
 * Vignette carte satellite non interactive (instantané figé) :
 *  base tuiles Google + overlay(s) PNG NDVI par parcelle + contour blanc.
 * `pointerEvents: none` → tous les gestes traversent vers la carte cliquable.
 */
export const DomainMiniMap: FunctionComponent<DomainMiniMapProps> = ({ contour, parcels }) => {
  const positions: LatLngTuple[] = contour.map((c) => [c.latitude, c.longitude]);

  return (
    <MapContainer
      center={positions[0] ?? [9.79, -13.5]}
      zoom={14}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: '#04382F' }}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomAnimation={false}
      fadeAnimation={false}
    >
      <TileLayer
        url={SATELLITE_URL}
        subdomains={SATELLITE_SUBDOMAINS}
        maxNativeZoom={20}
        maxZoom={21}
        minZoom={3}
      />

      {/* Overlays NDVI : PNG serveur déjà masqué à la parcelle, placé par ses bornes géo. */}
      {parcels.map((parcel) => {
        if (!parcel.tileUrl) return null;
        const b = parcel.tileBounds;
        const overlayBounds = b
          ? latLngBounds([b.south, b.west], [b.north, b.east])
          : parcel.coordinates.length >= 3
            ? latLngBounds(parcel.coordinates as LatLngTuple[])
            : null;
        if (!overlayBounds) return null;
        return (
          <ImageOverlay
            key={parcel.parcelId}
            url={parcel.tileUrl}
            bounds={overlayBounds}
            opacity={0.85}
            zIndex={200}
            interactive={false}
          />
        );
      })}

      {positions.length >= 3 && (
        <Polygon
          positions={positions}
          pathOptions={{ color: '#FFFFFF', weight: 2.5, opacity: 0.95, fillOpacity: 0 }}
        />
      )}

      <FitContour positions={positions} />
    </MapContainer>
  );
};
