import { useEffect, type FunctionComponent } from 'react';

import { latLngBounds, type LatLngTuple } from 'leaflet';
import { ImageOverlay, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import type { GeoBounds } from '@/features/Domaines/domaines.types';

const SATELLITE_URL = 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
const SATELLITE_SUBDOMAINS = ['0', '1', '2', '3'];

interface ParcelMapHeroProps {
  /** Polygone de la parcelle [lat, lng][]. */
  coordinates: [number, number][];
  /** URL PNG NDVI (overlay raster) si disponible. */
  tileUrl?: string;
  tileBounds?: GeoBounds;
  /** Hauteur réservée en haut (header) et en bas (feuille) pour cadrer le polygone. */
  topReservedPx: number;
  bottomReservedPx: number;
}

/** Cadre la carte sur la parcelle en réservant l'espace occulté par header + feuille. */
const FitParcel: FunctionComponent<{ positions: LatLngTuple[]; top: number; bottom: number }> = ({
  positions,
  top,
  bottom,
}) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    map.fitBounds(latLngBounds(positions), {
      paddingTopLeft: [32, top + 16],
      paddingBottomRight: [32, bottom + 16],
      maxZoom: 19,
      animate: false,
    });
  }, [map, positions, top, bottom]);
  return null;
};

/** Carte héro plein écran centrée sur une parcelle unique (satellite + NDVI). */
export const ParcelMapHero: FunctionComponent<ParcelMapHeroProps> = ({
  coordinates,
  tileUrl,
  tileBounds,
  topReservedPx,
  bottomReservedPx,
}) => {
  const positions: LatLngTuple[] = coordinates.map((c) => [c[0], c[1]]);
  const center: LatLngTuple = positions[0] ?? [9.79, -13.5];

  const overlayBounds = tileBounds
    ? latLngBounds([tileBounds.south, tileBounds.west], [tileBounds.north, tileBounds.east])
    : positions.length >= 3
      ? latLngBounds(positions)
      : null;

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ width: '100%', height: '100%', background: '#04382F' }}
      zoomControl={false}
      attributionControl={false}
      preferCanvas
    >
      <TileLayer
        url={SATELLITE_URL}
        subdomains={SATELLITE_SUBDOMAINS}
        maxNativeZoom={20}
        maxZoom={21}
        minZoom={3}
        keepBuffer={8}
      />

      {tileUrl && overlayBounds && (
        <ImageOverlay url={tileUrl} bounds={overlayBounds} opacity={0.85} zIndex={200} interactive={false} />
      )}

      {positions.length >= 3 && (
        <Polygon
          positions={positions}
          pathOptions={{
            color: '#4FC3F7',
            weight: 2.5,
            fillColor: '#4FC3F7',
            fillOpacity: tileUrl ? 0 : 0.4,
          }}
        />
      )}

      <FitParcel positions={positions} top={topReservedPx} bottom={bottomReservedPx} />
    </MapContainer>
  );
};
