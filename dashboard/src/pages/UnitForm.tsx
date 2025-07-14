import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnit, createUnit, updateUnit } from '../services/unitService';

const UnitForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<{
    name: string;
    status: string;
    type: string;
    rent: number;
    address: string;
    description: string;
    amenities: string[];
  }>({
    name: '',
    status: 'Available',
    type: '',
    rent: 0,
    address: '',
    description: '',
    amenities: [],
  });

  useEffect(() => {
    const fetchUnit = async () => {
      if (id) {
        const data = await getUnit(id);
        setUnit(data);
      }
    };
    fetchUnit();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUnit(prevUnit => ({ ...prevUnit, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      await updateUnit(id, unit);
    } else {
      await createUnit(unit);
    }
    navigate('/units');
  };

  return (
    <div>
      <h1>{id ? 'Edit Unit' : 'Add Unit'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" name="name" value={unit.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Status</label>
          <select name="status" value={unit.status} onChange={handleChange}>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
          </select>
        </div>
        <div>
          <label>Type</label>
          <input type="text" name="type" value={unit.type} onChange={handleChange} required />
        </div>
        <div>
          <label>Rent</label>
          <input type="number" name="rent" value={unit.rent} onChange={handleChange} required />
        </div>
        <div>
          <label>Address</label>
          <input type="text" name="address" value={unit.address} onChange={handleChange} required />
        </div>
        <div>
          <label>Description</label>
          <textarea name="description" value={unit.description} onChange={handleChange} required />
        </div>
        <button type="submit">{id ? 'Update' : 'Create'}</button>
      </form>
    </div>
  );
};

export default UnitForm;
