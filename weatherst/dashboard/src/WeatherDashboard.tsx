import { useState, useEffect, useReducer, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { WeatherChart } from "./WeatherChart";
import { SensorCard } from "./SensorCard";
import { KalmanFilterInfo } from "./KalmanFilterInfo";

interface WeatherData {
  id: number;
  temperature: number;
  pressure: number;
  humidity: number;
  altitude: number;
  alertState: number;
  time?: string;
  timestamp?: number;
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
  sensorData: WeatherData[];
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
  sensorData: [],
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
        sensorData: action.payload,
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

function formatDataForChart(data: WeatherData[]): ChartDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  return data
    .map((reading) => {
      const timeString = reading.time || "Unknown";
      const timeParts = timeString.split(":");
      const secondsPart = timeParts.length > 2 ? timeParts[2] : "00";

      return {
        time: secondsPart,
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

function WeatherDashboard() {
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

      const response = await fetch("/api/lora-weather", {
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

      const json = await response.json();

      if (!json.success || !Array.isArray(json.data)) {
        throw new Error("Invalid response format");
      }

      if (state.connectionLost) {
        dispatch({ type: "CONNECTION_RESTORED" });
      }

      dispatch({ type: "FETCH_SUCCESS", payload: json.data });
    } catch (err) {
      console.error("Error fetching data:", err);
      dispatch({ type: "FETCH_ERROR", error: err.message || "Unknown error" });
    }
  }, [state.connectionLost]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      () => {
        fetchData();
      },
      state.connectionLost ? 3000 : 1000
    );

    const refreshInterval = setInterval(() => {
      dispatch({ type: "UI_REFRESH" });
    }, 200);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, [fetchData, state.connectionLost]);

  const getWeatherStatus = () => {
    if (!state.currentReading)
      return { status: "Unknown", message: "Données indisponibles" };

    if (state.currentReading.alertState !== 0) {
      return {
        status: "Alerte",
        message: getAlertMessage(state.currentReading.alertState),
      };
    } else {
      return {
        status: "Normal",
        message: "Tous les paramètres sont dans les limites normales.",
      };
    }
  };

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

  const weatherStatus = getWeatherStatus();

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

      <KalmanFilterInfo
        weatherStatus={weatherStatus}
        currentReading={state.currentReading}
      />
    </div>
  );
}

export { WeatherDashboard };
