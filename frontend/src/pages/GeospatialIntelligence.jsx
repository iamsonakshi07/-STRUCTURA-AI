import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import {
  Globe2,
  Filter,
  Layers,
  Search,
  Building2,
  AlertTriangle,
  Info,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { geospatialService } from '../services/geospatialService';
import { formatDate, getRiskColor, getSeverityColor } from '../utils/formatters';

// Map re-centering helper
function SetMapView({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, zoom);
  }, [coords, zoom, map]);
  return null;
}

export const GeospatialIntelligence = () => {
  const [geoAssets, setGeoAssets] = useState([]);
  const [geoDefects, setGeoDefects] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);

  useEffect(() => {
    const fetchGeoData = async () => {
      setIsLoading(true);
      try {
        const [infraRes, defectsRes, heatRes] = await Promise.all([
          geospatialService.getInfrastructureGeoJSON(),
          geospatialService.getDefectsGeoJSON(),
          geospatialService.getHeatmap(),
        ]);
        setGeoAssets(infraRes?.features || []);
        setGeoDefects(defectsRes?.features || []);
        setHeatmapData(heatRes?.points || []);

        if (infraRes?.features && infraRes.features.length > 0) {
          // Pre-select first asset
          const first = infraRes.features[0];
          setSelectedAsset(first.properties);
        }
      } catch (err) {
        console.error('Failed to load geospatial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGeoData();
  }, []);

  const filteredAssets = geoAssets.filter((f) => {
    const props = f.properties || {};
    const matchesType =
      filterType === 'ALL' ||
      props.infrastructure_type?.toUpperCase() === filterType.toUpperCase();
    const matchesSearch =
      props.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      props.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleAssetClick = (props, coords) => {
    setSelectedAsset(props);
    setMapCenter([coords[1], coords[0]]);
    setMapZoom(13);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              GEOSPATIAL INTELLIGENCE & GIS MAP
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              RFC 7946 GeoJSON
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Interactive GIS map displaying infrastructure locations, defect hotspots, and risk heat density.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-soft-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-navy-800 border border-navy-700 text-xs text-soft-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="flex items-center bg-navy-800 p-1 rounded-xl border border-navy-700 text-xs">
            {['ALL', 'BRIDGE', 'OVERPASS', 'DAM'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === type
                    ? 'bg-cyan text-navy-950 font-bold shadow-cyan-glow'
                    : 'text-soft-muted hover:text-soft-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showHeatmap
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-glow'
                : 'bg-navy-800 text-soft-muted border-navy-700 hover:text-soft-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heatmap Overlay</span>
          </button>
        </div>
      </div>

      {/* Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Viewport (Col 1-8) */}
        <div className="lg:col-span-8 relative h-[600px] rounded-3xl overflow-hidden border border-cyan/30 shadow-2xl bg-navy-950">
          {isLoading ? (
            <LoadingSpinner label="Loading GIS Spatial Vector Layers..." size="lg" />
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="w-full h-full"
              style={{ background: '#101B2D' }}
            >
              <SetMapView coords={mapCenter} zoom={mapZoom} />

              {/* Dark CartoDB Matter tile layer */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />

              {/* Heatmap simulated density circles */}
              {showHeatmap &&
                heatmapData.map((hp, idx) => (
                  <CircleMarker
                    key={`heat-${idx}`}
                    center={[hp.latitude, hp.longitude]}
                    radius={35 * hp.intensity}
                    pathOptions={{
                      color: hp.intensity > 0.7 ? '#EF4444' : '#F59E0B',
                      fillColor: hp.intensity > 0.7 ? '#EF4444' : '#F59E0B',
                      fillOpacity: 0.25,
                      weight: 1,
                    }}
                  />
                ))}

              {/* Infrastructure Markers */}
              {filteredAssets.map((f) => {
                const coords = f.geometry.coordinates; // [lng, lat]
                const props = f.properties;
                const riskColor = getRiskColor(props.risk_level).hex;

                return (
                  <CircleMarker
                    key={`infra-${props.id}`}
                    center={[coords[1], coords[0]]}
                    radius={props.marker_radius || 14}
                    pathOptions={{
                      color: riskColor,
                      fillColor: riskColor,
                      fillOpacity: 0.85,
                      weight: 3,
                    }}
                    eventHandlers={{
                      click: () => handleAssetClick(props, coords),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div className="font-mono text-xs">
                        <span className="font-bold block">{props.name}</span>
                        <span className="text-[10px] text-gray-700 block">
                          Risk: {props.risk_level} • Health: {props.health_score}%
                        </span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}

              {/* Defect Markers */}
              {geoDefects.map((def) => {
                const coords = def.geometry.coordinates;
                const props = def.properties;
                const sevHex = props.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B';

                return (
                  <CircleMarker
                    key={`defect-${props.id}`}
                    center={[coords[1], coords[0]]}
                    radius={8}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: sevHex,
                      fillOpacity: 0.9,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <span className="font-bold text-red-600 block uppercase">
                          {props.defect_type} ({props.severity})
                        </span>
                        <span>{props.infrastructure_name}</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-2xl bg-navy-900/90 backdrop-blur-md border border-cyan/25 shadow-xl text-xs font-mono space-y-1.5">
            <span className="text-[10px] font-bold text-soft-subtle uppercase block mb-1">
              RISK CLASSIFICATION
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-healthy shadow-green-glow" />
              <span className="text-soft-white text-[11px]">Low Risk (Healthy)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning shadow-orange-glow" />
              <span className="text-soft-white text-[11px]">Moderate Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-critical shadow-red-glow" />
              <span className="text-soft-white text-[11px]">Critical / High Risk</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-navy-700">
              <span className="w-2 h-2 rounded-full bg-white border border-critical" />
              <span className="text-soft-subtle text-[10px]">Local Defect Point</span>
            </div>
          </div>
        </div>

        {/* Selected Asset Details Panel (Col 9-12) */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="glass" glow>
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-navy-700/60">
              <div>
                <span className="text-[10px] font-mono text-cyan uppercase tracking-wider block">
                  SELECTED ASSET PROFILE
                </span>
                <h3 className="text-base font-bold text-soft-white mt-1 leading-snug">
                  {selectedAsset?.name || 'Select Asset on Map'}
                </h3>
              </div>
              {selectedAsset && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${getRiskColor(selectedAsset.risk_level).badge}`}>
                  {selectedAsset.risk_level}
                </span>
              )}
            </div>

            {selectedAsset ? (
              <div className="mt-4 space-y-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-soft-muted">Location:</span>
                    <span className="text-soft-white">{selectedAsset.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-soft-muted">Asset Type:</span>
                    <span className="text-cyan uppercase">{selectedAsset.infrastructure_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-soft-muted">Construction Year:</span>
                    <span className="text-soft-white">{selectedAsset.construction_year}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-soft-muted">Material Type:</span>
                    <span className="text-soft-white capitalize">{selectedAsset.material_type?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/60">
                    <span className="text-[10px] text-soft-subtle block">HEALTH SCORE</span>
                    <span className="text-xl font-black text-healthy mt-1 block">
                      {selectedAsset.health_score}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/60">
                    <span className="text-[10px] text-soft-subtle block">ACTIVE DEFECTS</span>
                    <span className="text-xl font-black text-warning mt-1 block">
                      {selectedAsset.active_defects_count ?? 1}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Center map directly on asset
                      const f = geoAssets.find((a) => a.properties.id === selectedAsset.id);
                      if (f) {
                        setMapCenter([f.geometry.coordinates[1], f.geometry.coordinates[0]]);
                        setMapZoom(14);
                      }
                    }}
                  >
                    Center Map on Asset
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-soft-muted py-8 text-center">Click a marker on the map to view asset intelligence.</p>
            )}
          </Card>

          {/* Quick Assets List */}
          <Card variant="default">
            <span className="text-xs font-mono font-bold text-soft-white uppercase block mb-3">
              Monitored Assets List
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {geoAssets.map((f) => {
                const props = f.properties;
                const isSelected = selectedAsset?.id === props.id;
                return (
                  <button
                    key={props.id}
                    onClick={() => handleAssetClick(props, f.geometry.coordinates)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-navy-700/90 border-cyan text-soft-white'
                        : 'bg-navy-900/60 border-navy-700/60 text-soft-muted hover:text-soft-white'
                    }`}
                  >
                    <span className="truncate max-w-[200px] font-semibold">{props.name}</span>
                    <span className="font-mono text-cyan text-[11px]">{props.health_score}%</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
