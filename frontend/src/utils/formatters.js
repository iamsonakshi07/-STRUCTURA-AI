export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

export function formatShortDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export function getRiskColor(riskLevel) {
  switch ((riskLevel || '').toUpperCase()) {
    case 'LOW':
      return {
        badge: 'bg-healthy/15 text-healthy border-healthy/30',
        text: 'text-healthy',
        border: 'border-healthy',
        hex: '#22C55E',
        glow: 'shadow-green-glow',
        label: 'Low Risk',
      };
    case 'MODERATE':
      return {
        badge: 'bg-warning/15 text-warning border-warning/30',
        text: 'text-warning',
        border: 'border-warning',
        hex: '#F59E0B',
        glow: 'shadow-orange-glow',
        label: 'Moderate Risk',
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-600/20 text-orange-400 border-orange-500/40',
        text: 'text-orange-400',
        border: 'border-orange-500',
        hex: '#EA580C',
        glow: 'shadow-orange-glow',
        label: 'High Risk',
      };
    case 'CRITICAL':
    case 'CRITICAL_RISK':
      return {
        badge: 'bg-critical/15 text-critical border-critical/40',
        text: 'text-critical',
        border: 'border-critical',
        hex: '#EF4444',
        glow: 'shadow-red-glow',
        label: 'Critical Risk',
      };
    default:
      return {
        badge: 'bg-navy-600/40 text-soft-muted border-navy-500',
        text: 'text-soft-muted',
        border: 'border-navy-500',
        hex: '#94A3B8',
        glow: '',
        label: 'Unknown',
      };
  }
}

export function getSeverityColor(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        badge: 'bg-critical/15 text-critical border-critical/40',
        text: 'text-critical',
        border: 'border-critical',
        hex: '#EF4444',
      };
    case 'HIGH':
      return {
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        text: 'text-orange-400',
        border: 'border-orange-500',
        hex: '#F97316',
      };
    case 'MODERATE':
    case 'MEDIUM':
      return {
        badge: 'bg-warning/15 text-warning border-warning/30',
        text: 'text-warning',
        border: 'border-warning',
        hex: '#F59E0B',
      };
    case 'LOW':
    default:
      return {
        badge: 'bg-healthy/15 text-healthy border-healthy/30',
        text: 'text-healthy',
        border: 'border-healthy',
        hex: '#22C55E',
      };
  }
}

export function getPriorityColor(priority) {
  switch ((priority || '').toUpperCase()) {
    case 'IMMEDIATE_ACTION':
      return 'bg-critical/20 text-critical border-critical/40 animate-pulse';
    case 'URGENT':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'MONITOR':
      return 'bg-warning/20 text-warning border-warning/40';
    case 'ROUTINE':
    default:
      return 'bg-healthy/20 text-healthy border-healthy/40';
  }
}

export function getDefectCategoryInfo(defectType) {
  const normalized = (defectType || '').toLowerCase().replace(/[\s-]/g, '_');

  if (normalized.includes('crack')) {
    return {
      key: 'crack',
      name: 'Crack',
      color: '#EF4444', // Red
      tailwindColor: 'text-red-500',
      bgGlow: 'shadow-red-glow',
      badge: 'bg-red-500/15 text-red-400 border-red-500/40',
      description: 'Detection of visible cracks in concrete structures, including flexural cracks, structural cracks, and surface fractures.',
    };
  }

  if (normalized.includes('corrosion') || normalized.includes('rust')) {
    return {
      key: 'corrosion',
      name: 'Corrosion',
      color: '#F97316', // Orange
      tailwindColor: 'text-orange-500',
      bgGlow: 'shadow-orange-glow',
      badge: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
      description: 'Detection of rust, corrosion stains, and deterioration of concrete or metallic structural components.',
    };
  }

  if (normalized.includes('rebar') || normalized.includes('reinforce')) {
    return {
      key: 'rebar_exposure',
      name: 'Rebar Exposure',
      color: '#EAB308', // Yellow
      tailwindColor: 'text-yellow-400',
      bgGlow: 'shadow-yellow-glow',
      badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
      description: 'Detection of exposed reinforcing steel bars (rebar) caused by concrete spalling, deterioration, or cover loss.',
    };
  }

  if (
    normalized.includes('foundation') ||
    normalized.includes('shift') ||
    normalized.includes('settlement') ||
    normalized.includes('tilt') ||
    normalized.includes('displacement')
  ) {
    return {
      key: 'foundation_shift',
      name: 'Foundation Shift',
      color: '#A855F7', // Purple
      tailwindColor: 'text-purple-400',
      bgGlow: 'shadow-purple-glow',
      badge: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
      description: 'Detection of potential foundation displacement, settlement, tilting, or structural misalignment based on available visual evidence.',
    };
  }

  return {
    key: 'defect',
    name: defectType ? defectType.replace(/_/g, ' ') : 'Structural Defect',
    color: '#00C2D1',
    tailwindColor: 'text-cyan',
    bgGlow: 'shadow-cyan-glow',
    badge: 'bg-cyan/15 text-cyan border-cyan/40',
    description: 'Detection of structural anomaly and distress along monitored component.',
  };
}
