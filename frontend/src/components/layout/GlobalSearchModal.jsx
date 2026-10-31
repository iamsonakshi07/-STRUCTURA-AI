import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, AlertTriangle, Box, FileText, ArrowRight, X } from 'lucide-react';
import { Modal } from '../common/Modal';

export const GlobalSearchModal = ({ isOpen, onClose, infrastructures = [] }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const items = [
    { title: 'Overview Dashboard', category: 'Navigation', to: '/', icon: Building2 },
    { title: 'AI Defect Detection Studio', category: 'Tool', to: '/vision', icon: AlertTriangle },
    { title: 'Interactive 3D Digital Twin', category: '3D Twin', to: '/digital-twin', icon: Box },
    { title: 'Sensor Intelligence & FFT Waveforms', category: 'IoT', to: '/sensors', icon: Building2 },
    { title: 'RUL Prediction Forecasting Engine', category: 'Predictive', to: '/rul', icon: FileText },
    { title: 'Geospatial Intelligence Map', category: 'GIS', to: '/geospatial', icon: Building2 },
    { title: 'Compliance Inspection Reports', category: 'Reports', to: '/reports', icon: FileText },
    ...infrastructures.map((infra) => ({
      title: `${infra.name} (${infra.infrastructure_type.toUpperCase()})`,
      category: 'Infrastructure Asset',
      to: `/infrastructure?select=${infra.id}`,
      icon: Building2,
      subtitle: `${infra.location} • Health: ${infra.health_score || 85}%`,
    })),
  ];

  const filtered = query
    ? items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : items.slice(0, 7);

  const handleSelect = (to) => {
    navigate(to);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Platform Search" subtitle="Jump anywhere across assets, defects, and intelligence modules" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-cyan" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search assets, cracks, sensors, reports..."
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-cyan/40 text-sm text-soft-white focus:outline-none focus:ring-2 focus:ring-cyan/30"
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-soft-muted text-center py-6">No matching assets or views found.</p>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.to)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-navy-700/80 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-900 border border-navy-700 flex items-center justify-center text-cyan group-hover:border-cyan/50">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-soft-white group-hover:text-cyan transition-colors block">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-soft-subtle block">
                      {item.subtitle || item.category}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-soft-subtle group-hover:text-cyan group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
