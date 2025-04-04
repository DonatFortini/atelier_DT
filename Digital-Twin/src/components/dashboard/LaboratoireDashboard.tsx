import { useState, useEffect, useReducer, useCallback } from "react";
import {
  RefreshCw,
  Wind,
  Gauge,
  AlertCircle as AlertCircleIcon,
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
  Bar,
} from "recharts";

export interface AirQualityData {
  pm10: number;
  alertAQI: boolean;
  airQualityStatus: string;
  alertPM25: boolean;
  aqiValue: number;
  alertState: number;
  pm25: number;
  alertPM10: boolean;
  timestamp?: string;
}

export interface ChartDataPoint {
  alertPM25: any;
  alertPM10: any;
  alertAQI: any;
  time: string;
  fullTime: string;
  pm10: number;
  pm25: number;
  aqi: number;
  alertState: number;
  airQualityStatus: string;
}

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
  | { type: "FETCH_SUCCESS"; payload: AirQualityData[] }
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

export function getAirQualityLevel(aqi: number): string {
  if (aqi <= 50) return "Bon";
  if (aqi <= 100) return "Modéré";
  if (aqi <= 150) return "Mauvais pour groupes sensibles";
  if (aqi <= 200) return "Mauvais";
  if (aqi <= 300) return "Très mauvais";
  return "Dangereux";
}

export function getAirQualityColor(aqi: number): string {
  if (aqi <= 50) return "rgb(0, 228, 0)"; // Green
  if (aqi <= 100) return "rgb(255, 255, 0)"; // Yellow
  if (aqi <= 150) return "rgb(255, 126, 0)"; // Orange
  if (aqi <= 200) return "rgb(255, 0, 0)"; // Red
  if (aqi <= 300) return "rgb(153, 0, 76)"; // Purple
  return "rgb(126, 0, 35)"; // Maroon
}

function formatDataForChart(data: AirQualityData[]): ChartDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  return data
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
        pm10: reading.pm10,
        pm25: reading.pm25,
        aqi: reading.aqiValue,
        alertState: reading.alertState,
        airQualityStatus:
          reading.airQualityStatus || getAirQualityLevel(reading.aqiValue),
        alertPM25: reading.alertPM25 || false,
        alertPM10: reading.alertPM10 || false,
        alertAQI: reading.alertAQI || false,
      };
    })
    .reverse()
    .slice(0, 20);
}

function AirQualityChart({ data }: { data: ChartDataPoint[] }) {
  // View mode: "single" or "all"
  const [viewMode, setViewMode] = useState("single");
  // For single view mode, which metric to show
  const [selectedMetric, setSelectedMetric] = useState("aqi");

  // Definition of metrics for cleaner code
  const metrics = {
    aqi: {
      key: "aqi",
      name: "Indice de Qualité de l'Air",
      unit: "",
      color: "rgb(59, 130, 246)", // Blue
      domain: [0, 300],
      formatter: (value: number) => value.toFixed(0),
    },
    pm25: {
      key: "pm25",
      name: "PM2.5",
      unit: "µg/m³",
      color: "rgb(16, 185, 129)", // Green
      domain: [0, "dataMax"],
      formatter: (value: number) => value.toFixed(1) + " µg/m³",
    },
    pm10: {
      key: "pm10",
      name: "PM10",
      unit: "µg/m³",
      color: "rgb(245, 158, 11)", // Amber
      domain: [0, "dataMax"],
      formatter: (value: number) => value.toFixed(1) + " µg/m³",
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
            <p className="text-sm mt-1">
              <span className="font-medium">Qualité de l'air: </span>
              <span style={{ color: getAirQualityColor(dataPoint.aqi) }}>
                {dataPoint.airQualityStatus}
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
                  <span>{metric.formatter(dataPoint[metric.key])}</span>
                </p>
              ))}
              <p className="text-sm mt-1">
                <span className="font-medium">Qualité de l'air: </span>
                <span style={{ color: getAirQualityColor(dataPoint.aqi) }}>
                  {dataPoint.airQualityStatus}
                </span>
              </p>
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
            <CardTitle>Qualité de l'Air</CardTitle>
            <CardDescription>Mesures récentes</CardDescription>
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
                  domain={
                    currentMetric.domain.map((value) =>
                      typeof value === "number" ? value : 0
                    ) as number[]
                  }
                  label={{
                    value: `${currentMetric.name} ${
                      currentMetric.unit ? `(${currentMetric.unit})` : ""
                    }`,
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
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  name={`${currentMetric.name} ${
                    currentMetric.unit ? `(${currentMetric.unit})` : ""
                  }`}
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
              // All metrics view
              <ComposedChart
                data={data}
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

                <YAxis
                  yAxisId="left"
                  domain={[0, "dataMax"]}
                  label={{
                    value: "PM (µg/m³)",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "var(--foreground)",
                      fontSize: 12,
                    },
                  }}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 300]}
                  label={{
                    value: "Indice de qualité de l'air",
                    angle: 90,
                    position: "insideRight",
                    style: {
                      textAnchor: "middle",
                      fill: "var(--foreground)",
                      fontSize: 12,
                    },
                  }}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip content={<CustomTooltip />} />
                <Legend />

                <Bar
                  name="Indice de Qualité de l'Air"
                  yAxisId="right"
                  type="monotone"
                  dataKey="aqi"
                  fill={metrics.aqi.color}
                  isAnimationActive={false}
                />

                <Line
                  name="PM2.5 (µg/m³)"
                  yAxisId="left"
                  type="monotone"
                  dataKey="pm25"
                  stroke={metrics.pm25.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />

                <Line
                  name="PM10 (µg/m³)"
                  yAxisId="left"
                  type="monotone"
                  dataKey="pm10"
                  stroke={metrics.pm10.color}
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

function AirQualityStatus({
  currentReading,
}: {
  currentReading: ChartDataPoint;
}) {
  return (
    <Card className="h-[70vh]">
      <CardHeader>
        <CardTitle>Statut de la Qualité de l'Air</CardTitle>
        <CardDescription>
          Indices actuels de pollution atmosphérique
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-[calc(100%-5rem)]">
        <div
          className="w-40 h-40 rounded-full mb-6 border border-border flex items-center justify-center"
          style={{ backgroundColor: getAirQualityColor(currentReading.aqi) }}
        >
          <div className="text-white text-center">
            <p className="font-bold text-2xl">{currentReading.aqi}</p>
            <p className="text-sm">{currentReading.airQualityStatus}</p>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-xs">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <AlertCircleIcon
                className="h-6 w-6"
                style={{ color: "rgb(59, 130, 246)" }}
              />
              <div>
                <div className="text-sm font-medium">
                  Indice de Qualité de l'Air
                </div>
                <div className="text-lg font-bold">
                  {currentReading.aqi.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <Wind
                className="h-6 w-6"
                style={{ color: "rgb(16, 185, 129)" }}
              />
              <div>
                <div className="text-sm font-medium">PM2.5</div>
                <div className="text-lg font-bold">
                  {currentReading.pm25.toFixed(1)} µg/m³
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
              <Gauge
                className="h-6 w-6"
                style={{ color: "rgb(245, 158, 11)" }}
              />
              <div>
                <div className="text-sm font-medium">PM10</div>
                <div className="text-lg font-bold">
                  {currentReading.pm10.toFixed(1)} µg/m³
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">Alertes</div>
              <div className="flex flex-wrap gap-2">
                {currentReading.alertPM25 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    Alerte PM2.5
                  </span>
                )}
                {currentReading.alertPM10 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    Alerte PM10
                  </span>
                )}
                {currentReading.alertAQI && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    Alerte AQI
                  </span>
                )}
                {!currentReading.alertAQI &&
                  !currentReading.alertPM10 &&
                  !currentReading.alertPM25 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Aucune alerte
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const LaboratoireDashboard: React.FC = () => {
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

      // Use the air-quality API endpoint from the middleware
      const response = await fetch("/api/air-quality", {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const airQualityData: AirQualityData[] = await response.json();

      if (state.connectionLost) {
        dispatch({ type: "CONNECTION_RESTORED" });
      }

      dispatch({ type: "FETCH_SUCCESS", payload: airQualityData });
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
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
          Tableau de Bord de la Qualité de l'Air
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
          <p>En attente des données de qualité de l'air...</p>
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
          Tableau de Bord de la Qualité de l'Air
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
          <AirQualityChart data={state.data} />
        </div>

        <div className="lg:col-span-2">
          <AirQualityStatus currentReading={state.currentReading} />
        </div>
      </div>
    </div>
  );
};

export default LaboratoireDashboard;
