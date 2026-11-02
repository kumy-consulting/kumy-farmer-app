import { Fragment, useEffect, type FunctionComponent } from 'react';

import { latLngBounds, type LatLngTuple } from 'leaflet';
import { ImageOverlay, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import type { DetailParcel } from '../domaines.types';

const SATELLITE_URL = 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
const SATELLITE_SUBDOMAINS = ['0', '1', '2', '3'];

interface DomaineDetailMapProps {
  /** Contour du domaine [lat, lng][]. */
  contour: [number, number][];
  /** Parcelles NDVI (overlay raster + contour bleu). */
  parcels: DetailParcel[];
  /** Hauteur réservée en haut (header) et en bas (feuille) pour cadrer le polygone. */
  topReservedPx: number;
  bottomReservedPx: number;
}

/** Cadre la carte sur le domaine en réservant l'espace occulté par le header et la feuille. */
const FitContour: FunctionComponent<{ positions: LatLngTuple[]; top: number; bottom: number }> = ({
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
      maxZoom: 18,
      animate: false,
    });
  }, [map, positions, top, bottom]);
  return null;
};

export const DomaineDetailMap: FunctionComponent<DomaineDetailMapProps> = ({
  contour,
  parcels,
  topReservedPx,
  bottomReservedPx,
}) => {
  const contourPositions: LatLngTuple[] = contour.map((c) => [c[0], c[1]]);
  const allPositions: LatLngTuple[] = [
    ...contourPositions,
    ...parcels.flatMap((p) => p.coordinates.map((c) => [c[0], c[1]] as LatLngTuple)),
  ];
  const center: LatLngTuple = contourPositions[0] ?? [9.79, -13.5];

  return (
    <MapContainer
      center={center}
      zoom={15}
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

      {parcels.map((parcel) => {
        const parcelCoords: LatLngTuple[] = parcel.coordinates.map((c) => [c[0], c[1]]);
        const b = parcel.tileBounds;
        const overlayBounds = b
          ? latLngBounds([b.south, b.west], [b.north, b.east])
          : parcelCoords.length >= 3
            ? latLngBounds(parcelCoords)
            : null;
        return (
          <Fragment key={parcel.parcelId}>
            {parcel.tileUrl && overlayBounds && (
              <ImageOverlay
                url={parcel.tileUrl}
                bounds={overlayBounds}
                opacity={0.85}
                zIndex={200}
                interactive={false}
              />
            )}
            {parcelCoords.length >= 3 && (
              <Polygon
                positions={parcelCoords}
                pathOptions={{
                  color: '#4FC3F7',
                  weight: 2,
                  fillColor: '#4FC3F7',
                  fillOpacity: parcel.tileUrl ? 0 : 0.4,
                }}
              />
            )}
          </Fragment>
        );
      })}

      {contourPositions.length > 2 && (
        <Polygon
          positions={contourPositions}
          pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: '#FFFFFF', fillOpacity: 0.15 }}
        />
      )}

      <FitContour positions={allPositions} top={topReservedPx} bottom={bottomReservedPx} />
    </MapContainer>
  );
};
