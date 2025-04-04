import { useState, useEffect, useReducer, useCallback } from "react";
import { RefreshCw, Car, Timer, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ParkingData {
  occupancyTime: number;
  formattedOccupancyTime: string;
  parkingState: number;
  timestamp: string;
  parkingStatus: string;
  sensorData?: boolean;
}

export interface ParkingSpot {
  id: string;
  row: number;
  col: number;
  occupied: boolean;
  isHandicap: boolean;
  hasSensor: boolean;
  sensorData?: boolean;
}

interface DashboardState {
  data: ParkingData[];
  currentReading: ParkingData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
  connectionLost: boolean;
  retryCount: number;
  parkingGrid: ParkingSpot[];
}

type DashboardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ParkingData[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "CONNECTION_RESTORED" }
  | { type: "UI_REFRESH" }
  | { type: "MANUAL_REFRESH" }
  | { type: "UPDATE_GRID"; payload: ParkingSpot[] };

// Configuration statique du parking (grille 3x3)
const initialParkingGrid: ParkingSpot[] = [
  {
    id: "A1",
    row: 0,
    col: 0,
    occupied: false,
    isHandicap: false,
    hasSensor: true,
    sensorData: false,
  },
  {
    id: "A2",
    row: 0,
    col: 1,
    occupied: false,
    isHandicap: false,
    hasSensor: false,
  },
  {
    id: "A3",
    row: 0,
    col: 2,
    occupied: false,
    isHandicap: true,
    hasSensor: false,
  },
  {
    id: "B1",
    row: 1,
    col: 0,
    occupied: false,
    isHandicap: false,
    hasSensor: false,
  },
  {
    id: "B2",
    row: 1,
    col: 1,
    occupied: false,
    isHandicap: false,
    hasSensor: false,
  },
  {
    id: "B3",
    row: 1,
    col: 2,
    occupied: true,
    isHandicap: false,
    hasSensor: false,
  }, // Occupée par défaut
  {
    id: "C1",
    row: 2,
    col: 0,
    occupied: true,
    isHandicap: false,
    hasSensor: false,
  }, // Occupée par défaut
  {
    id: "C2",
    row: 2,
    col: 1,
    occupied: false,
    isHandicap: true,
    hasSensor: false,
  },
  {
    id: "C3",
    row: 2,
    col: 2,
    occupied: false,
    isHandicap: false,
    hasSensor: false,
  },
];

// Nombre total d'emplacements et nombre de places handicapées
const TOTAL_PARKING_SPOTS = 9;
const HANDICAP_SPOTS = 2;

const initialState: DashboardState = {
  data: [],
  currentReading: null,
  loading: true,
  error: null,
  lastUpdate: Date.now(),
  connectionLost: false,
  retryCount: 0,
  parkingGrid: initialParkingGrid,
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
      const updatedData = action.payload;
      // Prendre la dernière lecture (la plus récente) plutôt que la première
      const currentReading =
        updatedData.length > 0 ? updatedData[updatedData.length - 1] : null;

      // Mise à jour de la grille de stationnement en fonction des données du capteur
      const updatedGrid = [...state.parkingGrid].map((spot) => {
        // Mettre à jour uniquement l'emplacement avec capteur (A1)
        if (spot.hasSensor && currentReading) {
          const isOccupied = Boolean(currentReading.parkingState);
          return {
            ...spot,
            occupied: isOccupied,
            sensorData: isOccupied,
          };
        }
        return spot;
      });

      return {
        ...state,
        data: updatedData,
        currentReading,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
        connectionLost: false,
        retryCount: 0,
        parkingGrid: updatedGrid,
      };
    }
    case "UPDATE_GRID":
      return {
        ...state,
        parkingGrid: action.payload,
      };
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

export function getParkingStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "disponible":
    case "available":
      return "bg-green-500";
    case "limité":
    case "limited":
      return "bg-amber-500";
    case "complet":
    case "full":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function ParkingGrid({
  grid,
  toggleSpot,
}: {
  grid: ParkingSpot[];
  toggleSpot: (spotId: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
      {grid.map((spot) => (
        <button
          key={spot.id}
          onClick={() => toggleSpot(spot.id)}
          className={`
            aspect-square flex items-center justify-center rounded-md border-2
            ${
              spot.occupied
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }
            ${spot.hasSensor && spot.sensorData ? "ring-2 ring-yellow-400" : ""}
            ${spot.isHandicap ? "border-blue-500 border-2" : "border-gray-300"}
            transition-colors
          `}
          title={`Place ${spot.id}${spot.isHandicap ? " (PMR)" : ""}${
            spot.hasSensor ? " (Capteur)" : ""
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <span className="font-bold">{spot.id}</span>
            {spot.isHandicap && <Users className="h-4 w-4 mt-1" />}
            {spot.hasSensor && <span className="text-xs mt-1">Capteur</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function ParkingStatus({
  currentReading,
  parkingGrid,
  toggleSpot,
}: {
  currentReading: ParkingData | null;
  parkingGrid: ParkingSpot[];
  toggleSpot: (spotId: string) => void;
}) {
  const totalSpots = TOTAL_PARKING_SPOTS;
  const occupiedSpots = parkingGrid.filter((spot) => spot.occupied).length;
  const availableSpots = totalSpots - occupiedSpots;
  const occupancyRate = (occupiedSpots / totalSpots) * 100;

  let parkingStatus = "Disponible";
  if (occupancyRate > 80) {
    parkingStatus = "Complet";
  } else if (occupancyRate > 50) {
    parkingStatus = "Limité";
  }

  const formattedOccupancyTime =
    currentReading?.formattedOccupancyTime || "00:00";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>État du Parking</CardTitle>
        <CardDescription>Plan et statistiques d'occupation</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-[calc(100%-7rem)] gap-6">
        <div
          className={`w-28 h-28 rounded-full mb-2 flex items-center justify-center text-white font-bold ${getParkingStatusColor(
            parkingStatus
          )}`}
        >
          <div className="text-center">
            <div className="text-2xl">{occupancyRate.toFixed(0)}%</div>
            <div className="text-sm">{parkingStatus}</div>
          </div>
        </div>

        <ParkingGrid grid={parkingGrid} toggleSpot={toggleSpot} />

        <div className="w-full space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-3 w-full">
            <div className="p-3 rounded-lg bg-muted flex items-center space-x-3">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Places disponibles</div>
                <div className="text-lg font-bold">
                  {availableSpots}/{totalSpots}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    (dont {HANDICAP_SPOTS} PMR)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted flex items-center space-x-3">
              <Timer className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-medium">
                  Temps de stationnement
                </div>
                <div className="text-lg font-bold">
                  {formattedOccupancyTime}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm mb-1">État des places</div>
              <div className="flex justify-between text-sm">
                <span>
                  Occupées:{" "}
                  <span className="font-semibold">{occupiedSpots}</span>
                </span>
                <span>
                  Libres:{" "}
                  <span className="font-semibold">{availableSpots}</span>
                </span>
                <span>
                  PMR: <span className="font-semibold">{HANDICAP_SPOTS}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground mt-auto">
          <p>Le capteur surveille uniquement la place A1</p>
          <p>Cliquez sur une place pour simuler un changement d'état</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ParkingInfo({ data }: { data: ParkingData | null }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Informations Parking</CardTitle>
        <CardDescription>Statistiques d'utilisation</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-7rem)] space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Détails du capteur</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">État actuel</div>
              <div className="font-medium">
                {Boolean(data?.parkingState) ? "Occupé" : "Libre"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Valeur: {data?.parkingState || 0}
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Dernière mise à jour
              </div>
              <div className="font-medium">
                {data?.timestamp
                  ? new Date(data.timestamp).toLocaleTimeString()
                  : "--:--:--"}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Informations générales</h3>
          <ul className="space-y-2">
            <li className="flex justify-between p-2 bg-muted/50 rounded">
              <span>Nombre total de places:</span>
              <span className="font-medium">{TOTAL_PARKING_SPOTS}</span>
            </li>
            <li className="flex justify-between p-2 bg-muted/50 rounded">
              <span>Places handicapées:</span>
              <span className="font-medium">{HANDICAP_SPOTS}</span>
            </li>
            <li className="flex justify-between p-2 bg-muted/50 rounded">
              <span>Capteurs actifs:</span>
              <span className="font-medium">1</span>
            </li>
            <li className="flex justify-between p-2 bg-muted/50 rounded">
              <span>Temps d'occupation :</span>
              <span className="font-medium">
                {data?.formattedOccupancyTime || "00:00"}
              </span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <p className="font-medium mb-1">Information</p>
          <p>Le parking est ouvert 24h/24 et 7j/7.</p>
          <p className="mt-1">
            Les places PMR sont indiquées par un contour bleu.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const ParkingDashboard: React.FC = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [forceRenderKey, setForceRenderKey] = useState(0);

  const handleManualRefresh = useCallback(() => {
    dispatch({ type: "MANUAL_REFRESH" });
    setForceRenderKey((prev) => prev + 1);
  }, []);

  const toggleSpotStatus = useCallback(
    (spotId: string) => {
      const updatedGrid = state.parkingGrid.map((spot) => {
        if (spot.id === spotId && !spot.hasSensor) {
          return { ...spot, occupied: !spot.occupied };
        }
        return spot;
      });

      dispatch({ type: "UPDATE_GRID", payload: updatedGrid });
    },
    [state.parkingGrid]
  );

  const fetchData = useCallback(async () => {
    try {
      dispatch({ type: "FETCH_START" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/parking", {
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

      const parkingData: ParkingData[] = await response.json();

      if (state.connectionLost) {
        dispatch({ type: "CONNECTION_RESTORED" });
      }

      dispatch({ type: "FETCH_SUCCESS", payload: parkingData });
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
        <h1 className="text-2xl font-bold mb-6">Tableau de Bord du Parking</h1>

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
          <p>En attente des données du parking...</p>
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
        <h1 className="text-2xl font-bold">Tableau de Bord du Parking</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Dernière mise à jour:{" "}
            {new Date(state.lastUpdate).toLocaleTimeString()}
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3">
          <ParkingInfo data={state.currentReading} />
        </div>

        <div className="lg:col-span-2">
          <ParkingStatus
            currentReading={state.currentReading}
            parkingGrid={state.parkingGrid}
            toggleSpot={toggleSpotStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default ParkingDashboard;
