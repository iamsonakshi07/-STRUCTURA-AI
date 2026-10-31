import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const LiveWaveform = ({ data = [], threshold = 6.0 }) => {
  const formattedData = data.map((d, index) => ({
    ...d,
    timeLabel: d.timestamp
      ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `T-${data.length - index}`,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f334d" vertical={false} />
          <XAxis
            dataKey="timeLabel"
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: '#1f334d' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: '#1f334d' }}
            domain={[0, 'auto']}
            unit=" mm/s"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#101B2D',
              borderColor: '#00C2D1',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono',
            }}
            itemStyle={{ color: '#F1F5F9' }}
          />
          {/* Anomaly Safety Threshold Reference */}
          <ReferenceLine
            y={threshold}
            label={{
              value: `Threshold (${threshold} mm/s)`,
              fill: '#EF4444',
              fontSize: 10,
              position: 'insideTopRight',
            }}
            stroke="#EF4444"
            strokeDasharray="4 4"
          />

          {/* Vibration Waveform Line */}
          <Line
            type="monotone"
            dataKey="vibration"
            name="Vibration (mm/s)"
            stroke="#00C2D1"
            strokeWidth={2.5}
            dot={(props) => {
              if (props.payload.is_anomaly) {
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="#EF4444"
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="animate-ping"
                  />
                );
              }
              return null;
            }}
            activeDot={{ r: 6, fill: '#00C2D1', stroke: '#ffffff' }}
            isAnimationActive={true}
          />

          {/* Secondary Acceleration Curve */}
          <Line
            type="monotone"
            dataKey="acceleration"
            name="Acceleration (m/s²)"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
