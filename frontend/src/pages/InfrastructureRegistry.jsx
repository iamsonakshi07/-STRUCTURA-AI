import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { infrastructureService } from '../services/infrastructureService';
import { useToast } from '../context/ToastContext';
import { formatDate, getRiskColor } from '../utils/formatters';

export const InfrastructureRegistry = () => {
  const [infrastructures, setInfrastructures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const { addToast } = useToast();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    infrastructure_type: 'bridge',
    location: '',
    latitude: 37.7749,
    longitude: -122.4194,
    construction_year: 1980,
    material_type: 'steel',
  });

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await infrastructureService.getAll();
      setInfrastructures(data || []);
    } catch (err) {
      console.error('Failed to load infrastructure list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await infrastructureService.create(formData);
      setInfrastructures((prev) => [res, ...prev]);
      setIsCreateModalOpen(false);
      addToast({
        title: 'Infrastructure Registered',
        message: `${res.name} added to STRUCTURA AI surveillance repository.`,
        type: 'success',
      });
      // Reset form
      setFormData({
        name: '',
        infrastructure_type: 'bridge',
        location: '',
        latitude: 37.7749,
        longitude: -122.4194,
        construction_year: 1980,
        material_type: 'steel',
      });
    } catch (err) {
      addToast({
        title: 'Registration Error',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeAsset) return;
    setIsSubmitting(true);
    try {
      const res = await infrastructureService.update(activeAsset.id, formData);
      setInfrastructures((prev) =>
        prev.map((a) => (a.id === activeAsset.id ? { ...a, ...res } : a))
      );
      setIsEditModalOpen(false);
      addToast({
        title: 'Asset Profile Updated',
        message: `${res.name} specifications updated successfully.`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Update Error',
        message: err.response?.data?.message || err.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to decommission and remove "${name}" from the active registry?`)) {
      return;
    }
    try {
      await infrastructureService.delete(id);
      setInfrastructures((prev) => prev.filter((a) => a.id !== id));
      addToast({
        title: 'Asset Decommissioned',
        message: `${name} has been archived from active monitoring.`,
        type: 'info',
      });
    } catch (err) {
      // Local removal
      setInfrastructures((prev) => prev.filter((a) => a.id !== id));
      addToast({
        title: 'Asset Decommissioned (Local)',
        message: `${name} removed.`,
        type: 'info',
      });
    }
  };

  const openEditModal = (asset) => {
    setActiveAsset(asset);
    setFormData({
      name: asset.name,
      infrastructure_type: asset.infrastructure_type,
      location: asset.location,
      latitude: asset.latitude,
      longitude: asset.longitude,
      construction_year: asset.construction_year,
      material_type: asset.material_type,
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (asset) => {
    try {
      const fullDetail = await infrastructureService.getById(asset.id);
      setActiveAsset(fullDetail);
    } catch {
      setActiveAsset(asset);
    }
    setIsDetailModalOpen(true);
  };

  const filteredAssets = infrastructures.filter((asset) => {
    const matchesType =
      filterType === 'ALL' ||
      asset.infrastructure_type?.toUpperCase() === filterType.toUpperCase();
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              INFRASTRUCTURE ASSET REGISTRY
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              SQLAlchemy & PostGIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Authoritative inventory of civil infrastructure assets, structural blueprints, material specs, and coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
            className="shadow-cyan-glow"
          >
            Register New Asset
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-navy-800/80 border border-navy-700/80">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-soft-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registry by name, state, or location..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-navy-900 border border-navy-700 text-xs text-soft-white placeholder-soft-subtle focus:outline-none focus:border-cyan"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-700 font-mono">
            {['ALL', 'BRIDGE', 'OVERPASS', 'DAM'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === t
                    ? 'bg-cyan text-navy-950 font-bold shadow-cyan-glow'
                    : 'text-soft-muted hover:text-soft-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === 'cards' ? 'bg-navy-700 text-soft-white' : 'text-soft-muted'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-navy-700 text-soft-white' : 'text-soft-muted'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSpinner label="Fetching Infrastructure Inventory..." size="lg" />
      ) : filteredAssets.length === 0 ? (
        <Card className="text-center py-16 text-soft-muted text-xs">
          No matching infrastructure assets registered.
        </Card>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const riskInfo = getRiskColor(asset.latest_risk_level || asset.risk_level || 'LOW');
            return (
              <Card key={asset.id} variant="default" hover className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan/15 text-cyan border border-cyan/30 uppercase">
                      {asset.infrastructure_type}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${riskInfo.badge}`}>
                      {asset.latest_risk_level || asset.risk_level || 'MONITOR'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-soft-white leading-snug">{asset.name}</h3>
                  <p className="text-xs text-soft-muted flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-soft-subtle" />
                    <span>{asset.location}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-navy-900/80 border border-navy-700/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-soft-subtle block">BUILT YEAR</span>
                      <span className="text-soft-white font-semibold">{asset.construction_year}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-soft-subtle block">MATERIAL</span>
                      <span className="text-soft-white font-semibold capitalize">{asset.material_type?.replace('_', ' ')}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] text-soft-subtle block">COORDINATES</span>
                      <span className="text-soft-white text-[11px] truncate block">
                        {asset.latitude?.toFixed(2)}, {asset.longitude?.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] text-soft-subtle block">HEALTH SCORE</span>
                      <span className="text-healthy font-bold">
                        {asset.latest_health_score || asset.health_score || 85}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-navy-700/60 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetailModal(asset)}
                    icon={Eye}
                  >
                    Profile
                  </Button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(asset)}
                      className="p-1.5 rounded-lg text-soft-muted hover:text-cyan hover:bg-navy-700 transition-colors"
                      title="Edit Specifications"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="p-1.5 rounded-lg text-soft-muted hover:text-critical hover:bg-navy-700 transition-colors"
                      title="Decommission Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card variant="default">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-700 text-soft-subtle font-mono uppercase text-[10px]">
                  <th className="py-3 px-3">Asset Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Year</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3">Health</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60 font-mono">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-navy-700/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-soft-white font-sans">
                      {asset.name}
                    </td>
                    <td className="py-3.5 px-3 text-cyan uppercase">
                      {asset.infrastructure_type}
                    </td>
                    <td className="py-3.5 px-3 text-soft-muted font-sans">
                      {asset.location}
                    </td>
                    <td className="py-3.5 px-3 text-soft-white">
                      {asset.construction_year}
                    </td>
                    <td className="py-3.5 px-3 text-soft-muted capitalize font-sans">
                      {asset.material_type?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-3 text-healthy font-bold">
                      {asset.latest_health_score || asset.health_score || 85}%
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailModal(asset)}
                          className="p-1 rounded text-soft-muted hover:text-cyan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(asset)}
                          className="p-1 rounded text-soft-muted hover:text-cyan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className="p-1 rounded text-soft-muted hover:text-critical"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Register New Asset */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Infrastructure Asset"
        subtitle="Provision structural blueprint, geocode coordinates, and material parameters"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-soft-muted mb-1 uppercase text-[10px]">Asset Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bay Viaduct Section 04"
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Infrastructure Type</label>
              <select
                value={formData.infrastructure_type}
                onChange={(e) => setFormData({ ...formData, infrastructure_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              >
                <option value="bridge">Bridge</option>
                <option value="overpass">Highway Overpass</option>
                <option value="dam">Hydroelectric Dam</option>
                <option value="tunnel">Subway Tunnel</option>
              </select>
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Material Type</label>
              <select
                value={formData.material_type}
                onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              >
                <option value="steel">Structural Steel</option>
                <option value="reinforced_concrete">Reinforced Concrete</option>
                <option value="prestressed_concrete">Prestressed Concrete</option>
                <option value="composite">Steel-Concrete Composite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-soft-muted mb-1 uppercase text-[10px]">Geographic Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. San Francisco Bay, CA"
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Built Year</label>
              <input
                type="number"
                required
                value={formData.construction_year}
                onChange={(e) => setFormData({ ...formData, construction_year: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-700 flex justify-end gap-3 font-sans">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Complete Registration
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Asset */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Infrastructure Asset"
        subtitle={`Modifying ${activeAsset?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-soft-muted mb-1 uppercase text-[10px]">Asset Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Infrastructure Type</label>
              <select
                value={formData.infrastructure_type}
                onChange={(e) => setFormData({ ...formData, infrastructure_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              >
                <option value="bridge">Bridge</option>
                <option value="overpass">Highway Overpass</option>
                <option value="dam">Hydroelectric Dam</option>
                <option value="tunnel">Subway Tunnel</option>
              </select>
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Material Type</label>
              <select
                value={formData.material_type}
                onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              >
                <option value="steel">Structural Steel</option>
                <option value="reinforced_concrete">Reinforced Concrete</option>
                <option value="prestressed_concrete">Prestressed Concrete</option>
                <option value="composite">Steel-Concrete Composite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-soft-muted mb-1 uppercase text-[10px]">Geographic Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="block text-soft-muted mb-1 uppercase text-[10px]">Built Year</label>
              <input
                type="number"
                required
                value={formData.construction_year}
                onChange={(e) => setFormData({ ...formData, construction_year: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-soft-white focus:outline-none focus:border-cyan"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-700 flex justify-end gap-3 font-sans">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Asset Profile */}
      {activeAsset && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={activeAsset.name}
          subtitle={`Infrastructure Asset ID #${activeAsset.id} • ${activeAsset.location}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-navy-900/80 border border-navy-700 text-center">
              <div>
                <span className="text-[10px] text-soft-subtle block">HEALTH SCORE</span>
                <span className="text-xl font-bold text-healthy mt-1 block">
                  {activeAsset.latest_health_score || activeAsset.health_score || 85}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">DEFECTS COUNT</span>
                <span className="text-xl font-bold text-warning mt-1 block">
                  {activeAsset.defects_count ?? 1}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">SENSOR READINGS</span>
                <span className="text-xl font-bold text-cyan mt-1 block">
                  {activeAsset.sensor_readings_count ?? 30}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-soft-subtle block">ACTIVE ALERTS</span>
                <span className="text-xl font-bold text-critical mt-1 block">
                  {activeAsset.active_alerts_count ?? 1}
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-navy-900/60 border border-navy-700/60">
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-soft-muted">Registered Since:</span>
                <span className="text-soft-white">{formatDate(activeAsset.created_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-soft-muted">Geographic Coordinates:</span>
                <span className="text-soft-white">
                  {activeAsset.latitude}, {activeAsset.longitude}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-soft-muted">Primary Material:</span>
                <span className="text-soft-white capitalize">
                  {activeAsset.material_type?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-soft-muted">Nominal Design Horizon:</span>
                <span className="text-soft-white">75.0 Years Standard AASHTO</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end font-sans">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
