import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUnits } from '../services/unitService';

interface Unit {
  id: number;
  name: string;
  status: string;
  type: string;
  rent: number;
}

const UnitListings = () => {
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const data = await getUnits();
      setUnits(data);
    };
    fetchUnits();
  }, []);

  return (
    <div>
      <h1>Unit Listings</h1>
      <Link to="/units/new">Add Unit</Link>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Type</th>
            <th>Rent</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit: any) => (
            <tr key={unit.id}>
              <td><Link to={`/units/${unit.id}`}>{unit.name}</Link></td>
              <td>{unit.status}</td>
              <td>{unit.type}</td>
              <td>${unit.rent}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button>Previous</button>
        <button>Next</button>
      </div>
    </div>
  );
};

export default UnitListings;
