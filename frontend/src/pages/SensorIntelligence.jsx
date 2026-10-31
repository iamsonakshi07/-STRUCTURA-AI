import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Activity,
  Zap,
  Radio,
  AlertTriangle,
  Play,
  RotateCw,
  Cpu,
  Waves,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LiveWaveform } from '../components/sensors/LiveWaveform';
import { SensorCard } from '../components/sensors/SensorCard';
import { BridgeSensorMap } from '../components/sensors/BridgeSensorMap';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { sensorService } from '../services/sensorService';
import { useToast } from '../context/ToastContext';

export const SensorIntelligence = () => {
  const { infrastructures = [] } = useOutletContext() || {};
  const { addToast } = useToast();

  const [selectedInfraId, setSelectedInfraId] = useState(1);
  const [readings, setReadings] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSensorId, setActiveSensorId] = useState('VIB-BRI-01');

  const fetchSensorData = async (infraId) => {
    setIsLoading(true);
    try {
      const [readingsData, anomaliesData] = await Promise.all([
        sensorService.getReadings(infraId, 40),
        sensorService.getAnomalies(infraId),
      ]);
      setReadings(readingsData || []);
      setAnomalies(anomaliesData || []);
    } catch (err) {
      console.error('Failed to load sensor telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData(selectedInfraId);
  }, [selectedInfraId]);

  // Interactive Anomaly Simulation
  const handleTriggerSimulation = async (injectAnomaly = true) => {
    setIsSimulating(true);
    try {
      const res = await sensorService.simulate({
        infrastructure_id: selectedInfraId,
        sensor_id: activeSensorId,
        num_samples: 30,
        inject_anomalies: injectAnomaly,
        anomaly_ratio: injectAnomaly ? 0.15 : 0.0,
      });

      addToast({
        title: injectAnomaly ? 'Anomaly Injected & Detected' : 'Baseline Stream Ingested',
        message: `Processed ${res.saved_count} samples. Isolation Forest detected ${res.anomalies_detected} anomaly spikes.`,
        type: injectAnomaly ? 'warning' : 'success',
      });

      // Refresh readings
      await fetchSensorData(selectedInfraId);
    } catch (err) {
      console.warn('Simulation fallback simulation:', err);
      // In-memory update
      const now = Date.now();
      const newItems = Array.from({ length: 15 }, (_, i) => ({
        id: Date.now() + i,
        infrastructure_id: selectedInfraId,
        sensor_id: activeSensorId,
        vibration: injectAnomaly && i === 7 ? 11.8 : +(1.5 + Math.random() * 1.2).toFixed(2),
        acceleration: injectAnomaly && i === 7 ? 3.4 : +(0.3 + Math.random() * 0.2).toFixed(2),
        frequency: +(12.0 + Math.random() * 4).toFixed(1),
        is_anomaly: injectAnomaly && i === 7,
        anomaly_score: injectAnomaly && i === 7 ? 0.94 : 0.04,
        timestamp: new Date(now - (15 - i) * 10000).toISOString(),
      }));
      setReadings((prev) => [...prev.slice(15), ...newItems]);
      addToast({
        title: 'Telemetry Sim Executed',
        message: 'Synthesized dynamic accelerometer telemetry stream.',
        type: 'info',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Compute statistical features from readings
  const latest = readings[readings.length - 1] || {};
  const vibValues = readings.map((r) => r.vibration || 0);
  const maxVib = vibValues.length ? Math.max(...vibValues) : 0;
  const meanVib = vibValues.length ? (vibValues.reduce((a, b) => a + b, 0) / vibValues.length).toFixed(2) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-soft-white font-mono">
              SENSOR INTELLIGENCE CENTER
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 uppercase">
              IoT Telemetry & PyTorch LSTM
            </span>
          </div>
          <p className="text-xs sm:text-sm text-soft-muted mt-1">
            Continuous vibration telemetry analysis, resonant frequency FFT tracking, and Isolation Forest anomaly inference.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedInfraId}
            onChange={(e) => setSelectedInfraId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-navy-800 border border-cyan/30 text-soft-white text-xs font-mono focus:outline-none"
          >
            {infrastructures.map((inf) => (
              <option key={inf.id} value={inf.id}>
                {inf.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTriggerSimulation(false)}
            isLoading={isSimulating}
            icon={Play}
          >
            Stream Normal Telemetry
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTriggerSimulation(true)}
            isLoading={isSimulating}
            icon={Zap}
            className="shadow-orange-glow bg-warning hover:bg-amber-400 text-navy-950"
          >
            Inject Anomaly Spike
          </Button>
        </div>
      </div>

      {/* Row 1: Live Waveform (Section 7.A) */}
      <Card variant="default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-soft-white font-mono">LIVE VIBRATION WAVEFORM</h3>
                <span className="flex items-center gap-1 text-[10px] font-mono text-healthy bg-healthy/15 px-2 py-0.5 rounded-full border border-healthy/30">
                  <Radio className="w-3 h-3 animate-pulse" /> 200 Hz Sampling
                </span>
              </div>
              <p className="text-xs text-soft-muted">
                Dynamic structural velocity waveform (RMS) with red safety threshold line at 6.0 mm/s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-soft-subtle block text-[10px]">PEAK VELOCITY</span>
              <span className={`font-bold ${maxVib > 6.0 ? 'text-critical' : 'text-cyan'}`}>
                {maxVib.toFixed(2)} mm/s
              </span>
            </div>
            <div>
              <span className="text-soft-subtle block text-[10px]">MEAN RMS</span>
              <span className="text-soft-white font-bold">{meanVib} mm/s</span>
            </div>
            <div>
              <span className="text-soft-subtle block text-[10px]">DOMINANT FREQ</span>
              <span className="text-soft-white font-bold">{latest.frequency || 8.5} Hz</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Acquiring sensor time-series..." size="md" />
        ) : (
          <LiveWaveform data={readings} threshold={6.0} />
        )}
      </Card>

      {/* Row 2: Sensor Health Cards (Section 7.B) & Anomaly Detection (Section 7.C) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SensorCard
          sensorId="VIB-BRI-01"
          infraName="Bridge A – South Pier"
          vibration={latest.vibration || 1.85}
          acceleration={latest.acceleration || 0.38}
          frequency={latest.frequency || 8.4}
          isAnomaly={latest.is_anomaly || false}
          timestamp={latest.timestamp}
          isActive={true}
        />
        <SensorCard
          sensorId="VIB-BRI-02"
          infraName="Bridge A – Mid Deck"
          vibration={2.42}
          acceleration={0.52}
          frequency={14.1}
          isAnomaly={false}
          timestamp={new Date().toISOString()}
          isActive={true}
        />
        <SensorCard
          sensorId="VIB-DAM-01"
          infraName="Dam C – Spillway Crest"
          vibration={11.4}
          acceleration={3.2}
          frequency={38.5}
          isAnomaly={true}
          timestamp={new Date().toISOString()}
          isActive={true}
        />
      </div>

      {/* Row 3: Sensor Distribution on Bridge Model (Section 7.D) */}
      <BridgeSensorMap
        activeSensorId={activeSensorId}
        onSelectSensor={(id) => {
          setActiveSensorId(id);
          addToast({
            title: `Sensor Node ${id} Selected`,
            message: 'Viewing dedicated telemetry channel and resonant harmonics.',
            type: 'info',
          });
        }}
      />
    </div>
  );
};
