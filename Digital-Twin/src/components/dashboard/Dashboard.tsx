import React from "react";
import HyperviseurDashboard from "./HyperviseurDashboard";
import LaboratoireDashboard from "./LaboratoireDashboard";
import MeteoDashboard from "./MeteoDashboard";
import ParkingDashboard from "./ParkingDashboard";

type BuildingType = "Hyperviseur" | "Laboratoire" | "Météo" | "Parking";

interface DashboardProps {
  activeBuilding: BuildingType;
}

const Dashboard: React.FC<DashboardProps> = ({ activeBuilding }) => {
  return (
    <div className="w-full h-full bg-background text-foreground p-5 overflow-y-auto">
      <h2 className="text-2xl font-bold mt-0 border-b border-border pb-3 mb-5">
        {activeBuilding}
      </h2>

      {activeBuilding === "Hyperviseur" && <HyperviseurDashboard />}
      {activeBuilding === "Laboratoire" && <LaboratoireDashboard />}
      {activeBuilding === "Météo" && <MeteoDashboard />}
      {activeBuilding === "Parking" && <ParkingDashboard />}
    </div>
  );
};

export default Dashboard;
