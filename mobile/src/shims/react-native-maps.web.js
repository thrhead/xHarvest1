/**
 * Web stub for react-native-maps — native codegen is not available on web.
 * Map screens show a placeholder; native APK/IPA still use the real package.
 */
const React = require('react');
const { View, Text, StyleSheet } = require('react-native');

function MapView({ children, style, ..._rest }) {
  return React.createElement(
    View,
    { style: [styles.box, style] },
    React.createElement(
      Text,
      { style: styles.label },
      'Harita (web önizleme — native uygulamada tam harita)',
    ),
    children,
  );
}

function Marker() {
  return null;
}

function Polygon() {
  return null;
}

function Circle() {
  return null;
}

function Polyline() {
  return null;
}

function Callout({ children }) {
  return children || null;
}

function UrlTile() {
  return null;
}

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
    minHeight: 220,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    padding: 12,
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

