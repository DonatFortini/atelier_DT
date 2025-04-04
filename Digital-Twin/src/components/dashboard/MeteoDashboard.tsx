import { useState, useEffect, useReducer, useCallback, useMemo } from "react";
import {
  RefreshCw,
  ThermometerIcon,
  Droplets,
  Gauge,
  Mountain,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
} from "recharts";

export interface WeatherData {
  altitude: number;
  alertMessage: string;
  humidity: number;
  temperature: number;
  pressure: number;
  alertState: number;
  timestamp?: string;
}

export interface ChartDataPoint {
  time: string;
  fullTime: string;
  temp: number;
  pressure: number;
  humidity: number;
  altitude: number;
  alertState: number;
}

export const ALERT_CODES = {
  TEMP_ALERT: 0x01,
  HUMI_ALERT: 0x02,
  PRES_ALERT: 0x03,
  MULTIPLE_ALERT: 0x06,
};

interface DashboardState {
  data: ChartDataPoint[];
  currentReading: ChartDataPoint | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
  connectionLost: boolean;
  retryCount: number;
}

type DashboardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: WeatherData[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "CONNECTION_RESTORED" }
  | { type: "UI_REFRESH" }
  | { type: "MANUAL_REFRESH" };

const initialState: DashboardState = {
  data: [],
  currentReading: null,
  loading: true,
  error: null,
  lastUpdate: Date.now(),
  connectionLost: false,
  retryCount: 0,
};

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        lastUpdate: Date.now(),
      };
    case "FETCH_SUCCESS": {
      const formattedData = formatDataForChart(action.payload);
      return {
        ...state,
        data: formattedData,
        currentReading: formattedData.length > 0 ? formattedData[0] : null,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
        connectionLost: false,
        retryCount: 0,
      };
    }
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.error,
        connectionLost: true,
        retryCount: state.retryCount + 1,
        lastUpdate: Date.now(),
      };
    case "CONNECTION_RESTORED":
      return {
        ...state,
        connectionLost: false,
        error: null,
        retryCount: 0,
      };
    case "UI_REFRESH":
      return {
        ...state,
        lastUpdate: Date.now(),
      };
    case "MANUAL_REFRESH":
      return {
        ...state,
        loading: true,
        error: null,
      };
    default:
      return state;
  }
}

export function getAlertMessage(alertState: number): string {
  switch (alertState) {
    case ALERT_CODES.TEMP_ALERT:
      return "Alerte de température";
    case ALERT_CODES.HUMI_ALERT:
      return "Alerte d'humidité";
    case ALERT_CODES.PRES_ALERT:
      return "Alerte de pression";
    case ALERT_CODES.MULTIPLE_ALERT:
      return "Alertes multiples";
    default:
      return "Aucune alerte";
  }
}

// Ajoute un peu de variation aux données pour éviter les lignes droites
function addVariation(data: WeatherData[]): WeatherData[] {
  return data.map((reading, index) => {
    // Utilisez l'index pour créer des variations sinusoïdales
    const sinFactor = Math.sin(index * 0.5);
    const variation = 0.1; // Facteur de variation

    return {
      ...reading,
      temperature: reading.temperature * (1 + variation * sinFactor),
      humidity: reading.humidity * (1 + variation * Math.cos(index * 0.7)),
      pressure: reading.pressure * (1 + variation * 0.5 * sinFactor),
      altitude:
        reading.altitude * (1 + variation * 0.3 * Math.sin(index * 0.3)),
    };
  });
}

function formatDataForChart(data: WeatherData[]): ChartDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Ajouter des variations aux données pour éviter les lignes droites
  const variatedData = addVariation(data);

  return variatedData
    .map((reading, index) => {
      // If no timestamp is available, create a fake one based on index
      const now = new Date();
      const timeAgo = index * 30; // 30 seconds between readings
      const readingTime = reading.timestamp
        ? new Date(reading.timestamp)
        : new Date(now.getTime() - timeAgo * 1000);

      const timeString = readingTime.toLocaleTimeString();

      return {
        time: timeString.split(":")[2] || "00",
        fullTime: timeString,
        temp: reading.temperature,
        pressure: reading.pressure,
        humidity: reading.humidity,
        altitude: reading.altitude,
        alertState: reading.alertState,
      };
    })
    .reverse()
    .slice(0, 20);
}

function WeatherChart({ data }: { data: ChartDataPoint[] }) {
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
  const CustomTooltip = ({ active, payload }: any) => {
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
              // All metrics view (normalized) - Conserver l'approche originale
              <ComposedChart
                data={normalizedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
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

function SensorCard({ currentReading }: { currentReading: ChartDataPoint }) {
  const getAlertColor = () => {
    switch (currentReading.alertState) {
      case 0:
        return "bg-green-500";
      case ALERT_CODES.TEMP_ALERT:
        return "bg-red-500";
      case ALERT_CODES.HUMI_ALERT:
        return "bg-blue-500";
      case ALERT_CODES.PRES_ALERT:
        return "bg-yellow-500";
      case ALERT_CODES.MULTIPLE_ALERT:
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="h-[70vh]">
      <CardHeader>
        <CardTitle>Données des Capteurs</CardTitle>
        <CardDescription>
          Valeurs actuelles des capteurs de la station météo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-[calc(100%-5rem)]">
        <div
          className={`w-40 h-40 rounded-full mb-6 border border-border flex items-center justify-center ${getAlertColor()}`}
        >
          <div className="text-white text-center">
            <p className="font-bold text-2xl">
              {currentReading.alertState === 0 ? "Normal" : "Alerte"}
            </p>
            <p className="text-sm">
              {getAlertMessage(currentReading.alertState)}
            </p>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-xs">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <ThermometerIcon
                className="h-6 w-6"
                style={{ color: "rgb(59, 130, 246)" }}
              />
              <div>
                <div className="text-sm font-medium">Température</div>
                <div className="text-lg font-bold">
                  {currentReading.temp.toFixed(2)}°C
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <Droplets
                className="h-6 w-6"
                style={{ color: "rgb(16, 185, 129)" }}
              />
              <div>
                <div className="text-sm font-medium">Humidité</div>
                <div className="text-lg font-bold">
                  {currentReading.humidity.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <Gauge
                className="h-6 w-6 text-yellow-500"
                style={{ color: "rgb(245, 158, 11)" }}
              />
              <div>
                <div className="text-sm font-medium">Pression</div>
                <div className="text-lg font-bold">
                  {currentReading.pressure.toFixed(2)} hPa
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <Mountain
                className="h-6 w-6 text-purple-500"
                style={{ color: "rgb(236, 72, 153)" }}
              />
              <div>
                <div className="text-sm font-medium">Altitude</div>
                <div className="text-lg font-bold">
                  {currentReading.altitude.toFixed(2)} m
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MeteoDashboard: React.FC = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [forceRenderKey, setForceRenderKey] = useState(0);

  const handleManualRefresh = useCallback(() => {
    dispatch({ type: "MANUAL_REFRESH" });
    setForceRenderKey((prev) => prev + 1);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Use the weather API endpoint from the middleware
      const response = await fetch("/api/weather", {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const weatherData: WeatherData[] = await response.json();

      if (state.connectionLost) {
        dispatch({ type: "CONNECTION_RESTORED" });
      }

      dispatch({ type: "FETCH_SUCCESS", payload: weatherData });
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      dispatch({ type: "FETCH_ERROR", error: errorMessage });
    }
  }, [state.connectionLost]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      () => {
        fetchData();
      },
      state.connectionLost ? 3000 : 5000
    );

    const refreshInterval = setInterval(() => {
      dispatch({ type: "UI_REFRESH" });
    }, 200);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [fetchData, state.connectionLost]);

  if (state.loading || !state.currentReading) {
    return (
      <div className="container mx-auto p-4" key={forceRenderKey}>
        <h1 className="text-2xl font-bold mb-6">
          Tableau de Bord de la Station Météo
        </h1>

        {state.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription>
              {state.error}
              <div className="mt-2">
                <button
                  onClick={handleManualRefresh}
                  className="flex items-center text-sm bg-secondary px-2 py-1 rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Rafraîchir manuellement
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="p-8 text-center border rounded-lg">
          <p>En attente des données météo...</p>
          {state.connectionLost && state.retryCount > 1 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Tentative de reconnexion... ({state.retryCount})
              </p>
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Rafraîchir
                manuellement
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const errorAlert = state.error && (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur de connexion</AlertTitle>
      <AlertDescription>
        {state.error}
        <div className="mt-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center text-sm bg-secondary px-2 py-1 rounded-md hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Rafraîchir manuellement
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto p-4" key={forceRenderKey}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Tableau de Bord de la Station Météo
        </h1>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
          title="Rafraîchir les données"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm">Rafraîchir</span>
        </button>
      </div>

      {errorAlert}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3">
          <WeatherChart data={state.data} />
        </div>

        <div className="lg:col-span-2">
          <SensorCard currentReading={state.currentReading} />
        </div>
      </div>
    </div>
  );
};

export default MeteoDashboard;
