import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type ChartDataPoint } from "./WeatherDashboard";

import f1 from "../public/f1.png";
import f2 from "../public/f2.png";

interface KalmanFilterInfoProps {
  weatherStatus: {
    status: string;
    message: string;
  };
  currentReading: ChartDataPoint;
}

export function KalmanFilterInfo({
  weatherStatus,
  currentReading,
}: KalmanFilterInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtres de Kalman et Informations du Système</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert
            variant={
              weatherStatus.status === "Alerte" ? "destructive" : "default"
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Statut: {weatherStatus.status}</AlertTitle>
            <AlertDescription>{weatherStatus.message}</AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Dernière Mise à Jour</h3>
              <p className="text-sm">{currentReading.fullTime} </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">ID de la Station</h3>
              <p className="text-sm">WEATHER-01</p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Emplacement</h3>
              <p className="text-sm">Extérieur</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 ">Filtres de Kalman</h3>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="p-4 rounded-lg bg-muted ">
                <h4 className="font-medium mb-2 ">
                  Fonctionnement du Filtre de Kalman
                </h4>
                <p className="text-sm">
                  Le filtre de Kalman est un algorithme récursif qui estime
                  l'état d'un système dynamique à partir de mesures bruitées. Il
                  fonctionne en deux étapes principales :
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>
                    Prédiction : Estime l'état suivant basé sur l'état précédent
                  </li>
                  <li>
                    Mise à jour : Corrige l'estimation avec les nouvelles
                    mesures
                  </li>
                </ul>
              </div>
            </div>

            <img src={f1} alt="Formule" />
            <img src={f2} alt="Formule" />
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Seuils d'Alerte</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">Température</div>
                <div className="text-sm">Seuil: 30°C</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">Humidité</div>
                <div className="text-sm">Seuil: 70%</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">Pression</div>
                <div className="text-sm">Seuil: &lt;1000 hPa</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
