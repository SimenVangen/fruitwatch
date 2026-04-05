import React from "react";

export default function FarmSelector({ farms, selectedFarm, setSelectedFarm }) {
  return (
    <select
      value={selectedFarm?.id || ""}
      onChange={e => {
        const farmId = Number(e.target.value); // convert to number
        const farm = farms.find(f => f.id === farmId);
        setSelectedFarm(farm);
      }}
      style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #E5E7EB" }}
    >
      <option value="">Select a farm</option>
      {farms.map(f => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}

