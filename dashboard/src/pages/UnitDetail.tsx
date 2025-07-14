import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUnit } from '../services/unitService';

interface Unit {
  id: number;
  name: string;
  status: string;
  type: string;
  rent: number;
  address: string;
  description: string;
  amenities: string[];
}

const UnitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      if (id) {
        const data = await getUnit(id);
        setUnit(data);
      }
    };
    fetchUnit();
  }, [id]);

  if (!unit) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{unit.name}</h1>
      <p><strong>Status:</strong> {unit.status}</p>
      <p><strong>Type:</strong> {unit.type}</p>
      <p><strong>Rent:</strong> ${unit.rent}</p>
      <p><strong>Address:</strong> {unit.address}</p>
      <p><strong>Description:</strong> {unit.description}</p>
      <h2>Amenities</h2>
      <ul>
        {unit.amenities.map(amenity => <li key={amenity}>{amenity}</li>)}
      </ul>
    </div>
  );
};

export default UnitDetail;
