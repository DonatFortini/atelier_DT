import type { Plugin } from "vite";

interface WeatherData {
  altitude: number;
  alertMessage: string;
  humidity: number;
  temperature: number;
  pressure: number;
  alertState: number;
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
  parking: ParkingData[];
  weather: WeatherData[];
  airQuality: AirQualityData[];
}

const MAX_POINTS = 500;

const weatherData: WeatherData[] = [];
const airQData: AirQualityData[] = [];
const parkingData: ParkingData[] = [];

const hypervisorData: HypervisorData = {
  lastUpdate: "",
  parking: [],
  weather: [],
  airQuality: [],
};

function handlePostRequest(req: any, res: any) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const jsonData = JSON.parse(body);
      const deviceProfileName = jsonData.deviceInfo?.deviceProfileName;
      const objectData = jsonData.object;

      if (deviceProfileName === "end-node LA66 meteo" && objectData) {
        addData(weatherData, objectData as WeatherData);
      } else if (
        deviceProfileName === "end-node LA66 air quality" &&
        objectData
      ) {
        addData(airQData, objectData as AirQualityData);
      } else if (deviceProfileName === "end-node LA66 parking" && objectData) {
        addData(parkingData, objectData as ParkingData);
      }

      sendJsonResponse(res, 200, {
        success: true,
        message: "Data categorized successfully",
      });
    } catch (err) {
      console.error("⚠️ Error parsing JSON:", err);
      sendJsonResponse(res, 400, {
        success: false,
        error: "Invalid JSON data",
      });
    }
  });
}

function addData<T>(dataArray: T[], data: T) {
  dataArray.push(data);
  if (dataArray.length > MAX_POINTS) {
    dataArray.shift();
  }
}

function sendJsonResponse(res: any, statusCode: number, data: object) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function handleGetRequest(res: any, data: any) {
  sendJsonResponse(res, 200, data);
}

function handleMethodNotAllowed(res: any, allowedMethod: string) {
  res.statusCode = 405;
  res.setHeader("Allow", allowedMethod);
  res.end("Method Not Allowed");
}

export default function simpleApiMiddleware(): Plugin {
  return {
    name: "simple-api-middleware",
    configureServer(server) {
      console.log("🚀 Simple API middleware initialized");

      server.middlewares.use("/api/data", (req, res, next) => {
        if (req.method === "POST") {
          handlePostRequest(req, res);
          return;
        }
        next();
      });

      server.middlewares.use("/api/air-quality", (req, res) => {
        if (req.method === "GET") {
          handleGetRequest(res, airQData);
        } else {
          handleMethodNotAllowed(res, "GET");
        }
      });

      server.middlewares.use("/api/parking", (req, res) => {
        if (req.method === "GET") {
          handleGetRequest(res, parkingData);
        } else {
          handleMethodNotAllowed(res, "GET");
        }
      });

      server.middlewares.use("/api/weather", (req, res) => {
        if (req.method === "GET") {
          handleGetRequest(res, weatherData);
        } else {
          handleMethodNotAllowed(res, "GET");
        }
      });

      server.middlewares.use("/api/all", (req, res) => {
        if (req.method === "GET") {
          hypervisorData.lastUpdate = new Date().toISOString();
          hypervisorData.weather = weatherData;
          hypervisorData.airQuality = airQData;
          hypervisorData.parking = parkingData;
          handleGetRequest(res, hypervisorData);
        } else {
          handleMethodNotAllowed(res, "GET");
        }
      });

      server.middlewares.use("/api/clear", (req, res) => {
        weatherData.length = 0;
        airQData.length = 0;
        parkingData.length = 0;

        sendJsonResponse(res, 200, {
          success: true,
          message: "All data arrays cleared",
        });
      });
    },
  };
}
