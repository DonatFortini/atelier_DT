import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import { type ChartDataPoint } from "./WeatherDashboard";
import { useState, useMemo } from "react";

interface WeatherChartProps {
  data: ChartDataPoint[];
}

export function WeatherChart({ data }: WeatherChartProps) {
  // View mode: "single" or "all"
  const [viewMode, setViewMode] = useState("single");
  // For single view mode, which metric to show
  const [selectedMetric, setSelectedMetric] = useState("temperature");

  // Definition of metrics for cleaner code
  const metrics = {
    temperature: {
      key: "temp",
      name: "Température",
      unit: "°C",
      color: "rgb(59, 130, 246)", // Blue
      domain: ["auto", "auto"],
      formatter: (value: number) => value.toFixed(1) + " °C",
    },
    humidity: {
      key: "humidity",
      name: "Humidité",
      unit: "%",
      color: "rgb(16, 185, 129)", // Green
      domain: [0, 100],
      formatter: (value: number) => value.toFixed(1) + " %",
    },
    pressure: {
      key: "pressure",
      name: "Pression",
      unit: "hPa",
      color: "rgb(245, 158, 11)", // Amber
      domain: ["auto", "auto"],
      formatter: (value: number) => value.toFixed(1) + " hPa",
    },
    altitude: {
      key: "altitude",
      name: "Altitude",
      unit: "m",
      color: "rgb(236, 72, 153)", // Pink
      domain: ["auto", "auto"],
      formatter: (value: number) => value.toFixed(1) + " m",
    },
  };

  // Handle metric selection and view mode toggling
  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    setViewMode("single");
  };

  const handleViewAllToggle = () => {
    setViewMode(viewMode === "all" ? "single" : "all");
  };

  // Normalize data for "view all" mode to make all metrics visible in same chart
  const normalizedData = useMemo(() => {
    if (viewMode !== "all") return data;

    // Find min/max values for each metric to create normalization scale
    let mins = {
      temp: Infinity,
      humidity: Infinity,
      pressure: Infinity,
      altitude: Infinity,
    };
    let maxs = {
      temp: -Infinity,
      humidity: -Infinity,
      pressure: -Infinity,
      altitude: -Infinity,
    };

    data.forEach((point) => {
      Object.keys(mins).forEach((key) => {
        const k = key as keyof typeof mins;
        mins[k] = Math.min(mins[k], point[k]);
        maxs[k] = Math.max(maxs[k], point[k]);
      });
    });

    // Create normalized data (0-100 scale for all metrics)
    return data.map((point) => {
      const normalized: any = { ...point };
      Object.keys(mins).forEach((key) => {
        const k = key as keyof typeof mins;
        const range = maxs[k] - mins[k];
        normalized[`${k}Normalized`] =
          range === 0 ? 50 : ((point[k] - mins[k]) / range) * 100;
        // Store original values for tooltip
        normalized[`${k}Original`] = point[k];
      });
      return normalized;
    });
  }, [data, viewMode]);

  // Get the current metric config for single view mode
  const currentMetric = metrics[selectedMetric as keyof typeof metrics];

  // Custom tooltip that adapts based on the view mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;

      if (viewMode === "single") {
        return (
          <div className="bg-card border border-border p-3 rounded-md shadow-md">
            <p className="font-medium mb-2">{dataPoint.fullTime}</p>
            <p
              className="text-sm flex justify-between gap-4"
              style={{ color: currentMetric.color }}
            >
              <span className="font-medium">{currentMetric.name}:</span>
              <span>
                {currentMetric.formatter(dataPoint[currentMetric.key])}
              </span>
            </p>
          </div>
        );
      } else {
        // All metrics view tooltip
        return (
          <div className="bg-card border border-border p-3 rounded-md shadow-md">
            <p className="font-medium mb-2">{dataPoint.fullTime}</p>
            <div className="space-y-1">
              {Object.entries(metrics).map(([key, metric]) => (
                <p
                  key={key}
                  className="text-sm flex justify-between gap-4"
                  style={{ color: metric.color }}
                >
                  <span className="font-medium">{metric.name}:</span>
                  <span>
                    {metric.formatter(
                      dataPoint[`${metric.key}Original`] ||
                        dataPoint[metric.key]
                    )}
                  </span>
                </p>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Card className="h-[70vh] overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle>Données météorologiques</CardTitle>
            <CardDescription>Mesures des 10 dernières minutes</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {Object.entries(metrics).map(([key, metric]) => (
              <button
                key={key}
                onClick={() => handleMetricSelect(key)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === "single" && selectedMetric === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
                style={{
                  borderBottom:
                    viewMode === "single" && selectedMetric === key
                      ? `2px solid ${metric.color}`
                      : "none",
                }}
              >
                {metric.name}
              </button>
            ))}
            <button
              onClick={handleViewAllToggle}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
              style={{
                borderBottom: viewMode === "all" ? `2px solid #888` : "none",
              }}
            >
              Tous
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-7rem)] overflow-hidden">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "single" ? (
              // Single metric view
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="fullTime"
                  reversed
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => tick}
                  label={{
                    value: "Horodatage",
                    position: "insideBottom",
                    offset: -10,
                    style: { fill: "var(--foreground)", fontSize: 12 },
                  }}
                />

                <YAxis
                  domain={currentMetric.domain}
                  label={{
                    value: `${currentMetric.name} (${currentMetric.unit})`,
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "var(--foreground)",
                      fontSize: 12,
                    },
                  }}
                  tick={{ fontSize: 12 }}
                  width={60}
                  tickFormatter={(tick) => {
                    // Format large numbers like pressure (e.g., 1013.2 -> 1013)
                    return currentMetric.key === "pressure"
                      ? Math.round(tick)
                      : tick;
                  }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  name={`${currentMetric.name} (${currentMetric.unit})`}
                  type="monotone"
                  dataKey={currentMetric.key}
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{
                    r: 6,
                    stroke: currentMetric.color,
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
              // All metrics view (normalized)
              <ComposedChart
                data={normalizedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="fullTime"
                  reversed
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => tick} // Display the full timestamp directly
                  label={{
                    value: "Horodatage",
                    position: "insideBottom",
                    offset: -10,
                    style: { fill: "var(--foreground)", fontSize: 12 },
                  }}
                />

                {/* Y-axis with no ticks for cleaner look */}
                <YAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                  label={{
                    value: "Valeurs normalisées",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "var(--foreground)",
                      fontSize: 12,
                    },
                  }}
                />

                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Draw each metric line */}
                <Line
                  name={`${metrics.temperature.name}`}
                  type="monotone"
                  dataKey="tempNormalized"
                  stroke={metrics.temperature.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />

                <Line
                  name={`${metrics.humidity.name}`}
                  type="monotone"
                  dataKey="humidityNormalized"
                  stroke={metrics.humidity.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />

                <Line
                  name={`${metrics.pressure.name}`}
                  type="monotone"
                  dataKey="pressureNormalized"
                  stroke={metrics.pressure.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />

                <Line
                  name={`${metrics.altitude.name}`}
                  type="monotone"
                  dataKey="altitudeNormalized"
                  stroke={metrics.altitude.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
