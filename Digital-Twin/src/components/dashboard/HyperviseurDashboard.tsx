import { useState, useEffect, useReducer, useCallback } from "react";
import {
  RefreshCw,
  ThermometerIcon,
  Droplets,
  Gauge,
  Car,
  Building2,
  Users,
  MapPin,
  Wind,
  AlertCircle as AlertCircleIcon,
  Timer,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeatherData {
  altitude: number;
  alertMessage: string;
  humidity: number;
  temperature: number;
  pressure: number;
  alertState: number;
  timestamp?: string;
}

interface AirQualityData {
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

interface ParkingData {
  occupancyTime: number;
  formattedOccupancyTime: string;
  parkingState: number;
  timestamp: string;
  parkingStatus: string;
}

interface HypervisorData {
  lastUpdate: string;
  weather: WeatherData[];
  airQuality: AirQualityData[];
  parking: ParkingData[];
}

interface DashboardState {
  data: HypervisorData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
  connectionLost: boolean;
  retryCount: number;
}

type DashboardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: HypervisorData }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "CONNECTION_RESTORED" }
  | { type: "UI_REFRESH" }
  | { type: "MANUAL_REFRESH" };

const initialState: DashboardState = {
  data: null,
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
      return {
        ...state,
        data: action.payload,
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

function getAirQualityLevel(aqi: number): string {
  if (aqi <= 50) return "Bon";
  if (aqi <= 100) return "Modéré";
  if (aqi <= 150) return "Mauvais";
  if (aqi <= 200) return "Très mauvais";
  if (aqi <= 300) return "Dangereux";
  return "Critique";
}

function getAirQualityColor(aqi: number): string {
  if (aqi <= 50) return "rgb(0, 228, 0)"; // Vert
  if (aqi <= 100) return "rgb(255, 255, 0)"; // Jaune
  if (aqi <= 150) return "rgb(255, 126, 0)"; // Orange
  if (aqi <= 200) return "rgb(255, 0, 0)"; // Rouge
  if (aqi <= 300) return "rgb(153, 0, 76)"; // Violet
  return "rgb(126, 0, 35)"; // Bordeaux
}

export const ALERT_CODES = {
  TEMP_ALERT: 0x01,
  HUMI_ALERT: 0x02,
  PRES_ALERT: 0x03,
  MULTIPLE_ALERT: 0x06,
};

function getParkingStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "available":
    case "disponible":
      return "rgb(16, 185, 129)"; // Vert
    case "limited":
    case "limité":
      return "rgb(245, 158, 11)"; // Ambre
    case "full":
    case "complet":
      return "rgb(239, 68, 68)"; // Rouge
    default:
      return "rgb(107, 114, 128)"; // Gris
  }
}

function CityOverview() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Aperçu Ville</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Population</span>
            </div>
            <span className="font-medium">2,4M</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Bâtiments</span>
            </div>
            <span className="font-medium">234</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Superficie</span>
            </div>
            <span className="font-medium">486 km²</span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Espaces Verts</span>
              <span className="text-sm font-medium">21%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: "21%",
                  backgroundColor: "#3498db",
                }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherWidget({
  latestWeather,
}: {
  latestWeather: WeatherData | null;
}) {
  const getAlertColor = () => {
    if (!latestWeather) return "bg-gray-500";

    switch (latestWeather.alertState) {
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Météo</CardTitle>
      </CardHeader>
      <CardContent>
        {latestWeather ? (
          <>
            <div className="flex justify-center mb-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${getAlertColor()}`}
              >
                <div className="text-center">
                  <p className="font-bold text-sm">
                    {latestWeather.alertState === 0 ? "Normal" : "Alerte"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThermometerIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Temp.</span>
                </div>
                <span className="text-sm font-medium">
                  {latestWeather.temperature?.toFixed(1)}°C
                </span>
              </div>

              <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Humidité</span>
                </div>
                <span className="text-sm font-medium">
                  {latestWeather.humidity?.toFixed(0)}%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Pression</span>
                </div>
                <span className="text-sm font-medium">
                  {latestWeather.pressure?.toFixed(0)} hPa
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">
              Données non disponibles
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AirQualityWidget({
  latestAirQuality,
}: {
  latestAirQuality: AirQualityData | null;
}) {
  if (!latestAirQuality) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Qualité de l'Air</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">
              Données non disponibles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const aqi = latestAirQuality.aqiValue;
  const status = latestAirQuality.airQualityStatus || getAirQualityLevel(aqi);
  const color = getAirQualityColor(aqi);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Qualité de l'Air</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            <div className="text-center">
              <p className="font-bold text-sm">{aqi}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Statut</span>
            </div>
            <span className="text-sm font-medium">{status}</span>
          </div>

          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-green-500" />
              <span className="text-sm">PM2.5</span>
            </div>
            <span className="text-sm font-medium">
              {latestAirQuality.pm25?.toFixed(1)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-amber-500" />
              <span className="text-sm">PM10</span>
            </div>
            <span className="text-sm font-medium">
              {latestAirQuality.pm10?.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ParkingWidget({
  latestParking,
}: {
  latestParking: ParkingData | null;
}) {
  if (!latestParking) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Parking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-muted-foreground">
              Données non disponibles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSpaces = 9;
  const occupiedSpaces = latestParking.parkingState + 2;
  const availableSpaces = totalSpaces - occupiedSpaces;
  const occupancyRate = (occupiedSpaces / totalSpaces) * 100;

  let status = latestParking.parkingStatus || "Disponible";
  if (!latestParking.parkingStatus) {
    if (occupancyRate > 90) {
      status = "Complet";
    } else if (occupancyRate > 70) {
      status = "Limité";
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Parking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: getParkingStatusColor(status) }}
          >
            <div className="text-center">
              <p className="font-bold text-sm">{occupancyRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Places libres</span>
            </div>
            <span className="text-sm font-medium">
              {availableSpaces}/{totalSpaces}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-green-500" />
              <span className="text-sm">Place A1</span>
            </div>
            <span className="text-sm font-medium">
              {latestParking.parkingState ? "Occupée" : "Libre"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-muted flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Temps moyen</span>
            </div>
            <span className="text-sm font-medium">
              {latestParking.formattedOccupancyTime}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfrastructureStatus() {
  const infrastructureData = [
    { name: "Énergie", value: 78, color: "#3498db" },
    { name: "Eau", value: 92, color: "#2ecc71" },
    { name: "Transport", value: 65, color: "#f39c12" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">État des Infrastructures</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infrastructureData.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function fetchHypervisorData(
  controller: AbortController
): Promise<HypervisorData> {
  const response = await fetch("/api/all", {
    signal: controller.signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur serveur hyperviseur: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

const HyperviseurDashboard: React.FC = () => {
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

      const hypervisorData = await fetchHypervisorData(controller);

      clearTimeout(timeoutId);

      if (state.connectionLost) {
        dispatch({ type: "CONNECTION_RESTORED" });
      }

      dispatch({ type: "FETCH_SUCCESS", payload: hypervisorData });
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

  if (state.loading || !state.data) {
    return (
      <div className="container mx-auto p-4" key={forceRenderKey}>
        <h1 className="text-2xl font-bold mb-6">Tableau de Bord Hyperviseur</h1>

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
          <p>En attente des données système...</p>
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

  const latestWeather = state.data.weather?.length
    ? state.data.weather[state.data.weather.length - 1]
    : null;
  const latestAirQuality = state.data.airQuality?.length
    ? state.data.airQuality[state.data.airQuality.length - 1]
    : null;
  const latestParking = state.data.parking?.length
    ? state.data.parking[state.data.parking.length - 1]
    : null;

  return (
    <div className="container mx-auto p-4" key={forceRenderKey}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de Bord Hyperviseur</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Dernière mise à jour:{" "}
            {new Date(
              state.data.lastUpdate || state.lastUpdate
            ).toLocaleTimeString()}
          </span>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Rafraîchir</span>
          </button>
        </div>
      </div>

      {errorAlert}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <CityOverview />
        </div>
        <div>
          <WeatherWidget latestWeather={latestWeather} />
        </div>
        <div>
          <AirQualityWidget latestAirQuality={latestAirQuality} />
        </div>
        <div>
          <ParkingWidget latestParking={latestParking} />
        </div>
      </div>

      <div className="mb-4">
        <InfrastructureStatus />
      </div>
    </div>
  );
};

export default HyperviseurDashboard;
