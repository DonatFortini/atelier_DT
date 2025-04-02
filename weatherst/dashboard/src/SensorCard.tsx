import { ThermometerIcon, Droplets, Gauge, Mountain } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartDataPoint,
  getAlertMessage,
  ALERT_CODES,
} from "./WeatherDashboard";
import { color } from "bun";

interface SensorCardProps {
  currentReading: ChartDataPoint;
}

export function SensorCard({ currentReading }: SensorCardProps) {
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
