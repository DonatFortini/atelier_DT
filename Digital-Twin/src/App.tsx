import { useState } from "react";
import CityViewer from "./components/CityViewer";
import Dashboard from "./components/dashboard/Dashboard";
import "./style.css";

type BuildingType = "Hyperviseur" | "Laboratoire" | "Météo" | "Parking";

function App() {
  const [activeBuilding, setActiveBuilding] =
    useState<BuildingType>("Hyperviseur");

  const handleBuildingSelect = (building: BuildingType) => {
    console.log(`Building selected: ${building}`);
    setActiveBuilding(building);
  };

  return (
    <div className="flex h-screen w-screen">
      <div className="w-2/3 h-full">
        <CityViewer
          onBuildingSelect={handleBuildingSelect}
          initialBuilding={activeBuilding}
        />
      </div>
      <div className="w-1/3 h-full">
        <Dashboard activeBuilding={activeBuilding} />
      </div>
    </div>
  );
}

export default App;
