import { useState, useEffect } from "react";
import CityViewer from "./components/CityViewer";
import Dashboard from "./components/dashboard/Dashboard";
import "./style.css";

type BuildingType = "Hyperviseur" | "Laboratoire" | "Météo" | "Parking";

function App() {
  const [activeBuilding, setActiveBuilding] =
    useState<BuildingType>("Hyperviseur");
  const [parkingA1Occupied, setParkingA1Occupied] = useState<boolean>(false);

  const handleBuildingSelect = (building: BuildingType) => {
    console.log(`Building selected: ${building}`);
    setActiveBuilding(building);
  };

  const handleParkingA1StateChange = (isOccupied: boolean) => {
    console.log(
      `Parking A1 occupation state changed to: ${
        isOccupied ? "Occupied" : "Free"
      }`
    );
    setTimeout(() => {
      setParkingA1Occupied(isOccupied);
    }, 0);
  };

  useEffect(() => {
    console.log(
      "App component - Current state of parkingA1Occupied:",
      parkingA1Occupied
    );
  }, [parkingA1Occupied]);

  return (
    <div className="flex h-screen w-screen">
      <div className="w-2/3 h-full">
        <CityViewer
          onBuildingSelect={handleBuildingSelect}
          initialBuilding={activeBuilding}
          parkingA1Occupied={parkingA1Occupied}
        />
      </div>
      <div className="w-1/3 h-full">
        <Dashboard
          activeBuilding={activeBuilding}
          onParkingA1StateChange={handleParkingA1StateChange}
        />
      </div>
    </div>
  );
}

export default App;
