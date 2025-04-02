import { serve } from "bun";
import index from "./index.html";

let weatherData: WeatherData[] = [];
const MAX_DATA_POINTS = 500;

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

const server = serve({
  port: 4225,
  routes: {
    "/": index,
    "/api/lora-weather": {
      async POST(req) {
        try {
          const url = new URL(req.url);
          const event = url.searchParams.get("event");

          if (event !== "up") {
            return Response.json(
              { success: false, message: "Invalid event type" },
              { status: 400 }
            );
          }

          let payload = null;

          try {
            payload = await req.json();
          } catch (jsonError) {
            return Response.json(
              {
                success: false,
                message: "Invalid JSON format: " + jsonError.message,
              },
              { status: 400 }
            );
          }

          if (
            payload?.deviceInfo?.deviceProfileName &&
            payload.deviceInfo.deviceProfileName.includes("meteo")
          ) {
            const {
              object: { temperature, altitude, alertState, humidity, pressure },
            } = payload;

            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              fractionalSecondDigits: 3,
            });

            const newDataPoint: WeatherData = {
              id: weatherData.length + 1,
              temperature,
              pressure,
              humidity,
              altitude,
              alertState,
              time: formattedTime,
              timestamp: timestamp.getTime(),
            };

            weatherData.push(newDataPoint);

            if (weatherData.length > MAX_DATA_POINTS) {
              weatherData.shift();
            }

            return Response.json({ success: true, data: newDataPoint });
          }

          return Response.json(
            { success: false, message: "Device profile name does not match" },
            { status: 400 }
          );
        } catch (error) {
          return Response.json(
            { success: false, message: error.message },
            { status: 500 }
          );
        }
      },
      GET() {
        return Response.json({ success: true, data: weatherData });
      },
    },
  },
});

console.log(`🚀 Server running at ${server.url}`);
