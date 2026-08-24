/**
 * Web implementation for react-native-maps using OpenStreetMap & Leaflet.
 * Enables full interactive map viewing, GPS pin picking, and polygon drawing on Web.
 */
const React = require('react');
const { useState, useEffect, useRef } = React;
const { View, StyleSheet, Text } = require('react-native');

function getLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve) => {
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css-shim')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-shim';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if (!document.getElementById('leaflet-js-shim')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js-shim';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve(window.L);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        }
      }, 100);
    }
  });
}

function MapView({
  children,
  style,
  initialRegion,
  region,
  onPress,
  onRegionChangeComplete,
  showsUserLocation,
  showsMyLocationButton,
  mapType,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  const lat = region?.latitude ?? initialRegion?.latitude ?? 39.92;
  const lng = region?.longitude ?? initialRegion?.longitude ?? 32.85;
  const latDelta = region?.latitudeDelta ?? initialRegion?.latitudeDelta ?? 0.08;
  const zoom = Math.max(4, Math.min(18, Math.round(Math.log2(360 / (latDelta || 0.08)))));

  // Initialize Leaflet Map
  useEffect(() => {
    let active = true;

    getLeaflet().then((L) => {
      if (!active || !L || !containerRef.current) return;
      if (mapInstanceRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: zoom || 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      // Handle map clicks (for GPS picking & Polygon drawing)
      map.on('click', (e) => {
        if (onPressRef.current) {
          onPressRef.current({
            nativeEvent: {
              coordinate: {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
              },
              position: { x: e.containerPoint.x, y: e.containerPoint.y },
            },
          });
        }
      });

      if (onRegionChangeComplete) {
        map.on('moveend', () => {
          const center = map.getCenter();
          const bounds = map.getBounds();
          onRegionChangeComplete({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
            longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
          });
        });
      }

      // Invalidate size once rendered
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync region center if changed externally
  useEffect(() => {
    if (mapInstanceRef.current && region && typeof region.latitude === 'number' && typeof region.longitude === 'number') {
      mapInstanceRef.current.setView([region.latitude, region.longitude]);
    }
  }, [region?.latitude, region?.longitude]);

  // Update Layers (Markers, Polygons)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup || typeof window === 'undefined' || !window.L) return;

    const L = window.L;
    layersGroup.clearLayers();

    React.Children.forEach(children, (child) => {
      if (!child || !child.props) return;

      // Polygon
      if (
        child.props.coordinates &&
        Array.isArray(child.props.coordinates) &&
        child.props.coordinates.length >= 2
      ) {
        const pts = child.props.coordinates
          .filter((c) => c && typeof c.latitude === 'number' && typeof c.longitude === 'number')
          .map((c) => [c.latitude, c.longitude]);

        if (pts.length >= 2) {
          const poly = L.polygon(pts, {
            color: child.props.strokeColor || '#2E7D32',
            fillColor: child.props.fillColor || 'rgba(46, 125, 50, 0.25)',
            weight: child.props.strokeWidth || 2,
          });
          layersGroup.addLayer(poly);
        }
      }
      // Marker
      else if (
        child.props.coordinate &&
        typeof child.props.coordinate.latitude === 'number' &&
        typeof child.props.coordinate.longitude === 'number'
      ) {
        const { latitude, longitude } = child.props.coordinate;
        const color = child.props.pinColor || '#2E7D32';
        const title = child.props.title;
        const desc = child.props.description;

        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 0.95,
          weight: 2,
        });

        if (title || desc) {
          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; padding: 2px;">
              <strong style="font-size: 13px; color: #0f172a;">${title || 'Konum'}</strong>
              ${desc ? `<p style="font-size: 11px; color: #64748b; margin-top: 2px;">${desc}</p>` : ''}
            </div>
          `);
          if (title && title.length <= 4) {
            marker.bindTooltip(title, { permanent: true, direction: 'top', offset: [0, -7] });
          }
        }
        layersGroup.addLayer(marker);
      }
    });
  }, [children]);

  return React.createElement(
    View,
    { style: [styles.box, style] },
    React.createElement('div', {
      ref: containerRef,
      style: { width: '100%', height: '100%', minHeight: 220, position: 'relative' },
    })
  );
}

function Marker(props) {
  return null;
}
Marker.displayName = 'Marker';

function Polygon(props) {
  return null;
}
Polygon.displayName = 'Polygon';

function Circle(props) {
  return null;
}
Circle.displayName = 'Circle';

function Polyline(props) {
  return null;
}
Polyline.displayName = 'Polyline';

function Callout({ children }) {
  return children || null;
}
Callout.displayName = 'Callout';

function UrlTile(props) {
  return null;
}
UrlTile.displayName = 'UrlTile';

function WMSTile() {
  return null;
}

function Overlay() {
  return null;
}

function Heatmap() {
  return null;
}

function Geojson() {
  return null;
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    minHeight: 220,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

MapView.Marker = Marker;
MapView.Polygon = Polygon;
MapView.Circle = Circle;
MapView.Polyline = Polyline;
MapView.Callout = Callout;
MapView.UrlTile = UrlTile;
MapView.WMSTile = WMSTile;
MapView.Overlay = Overlay;
MapView.Heatmap = Heatmap;
MapView.Geojson = Geojson;

module.exports = MapView;
module.exports.default = MapView;
module.exports.MapView = MapView;
module.exports.Marker = Marker;
module.exports.Polygon = Polygon;
module.exports.Circle = Circle;
module.exports.Polyline = Polyline;
module.exports.Callout = Callout;
module.exports.UrlTile = UrlTile;
module.exports.WMSTile = WMSTile;
module.exports.Overlay = Overlay;
module.exports.Heatmap = Heatmap;
module.exports.Geojson = Geojson;
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = undefined;


