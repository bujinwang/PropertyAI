import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rentalService } from '../services/rentalService';

/**
 * @deprecated This component is deprecated. Use RentalForm instead.
 * Legacy unit form page - redirects to rental form
 */

const UnitForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    propertyType: 'APARTMENT',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    rent: 0,
    bedrooms: 0,
    bathrooms: 0,
    size: 0,
    deposit: 0,
    isAvailable: true,
    unitNumber: '',
    floorNumber: 0,
    description: '',
    amenities: {} as Record<string, any>
  });

  useEffect(() => {
    console.warn('UnitForm component is deprecated. Use RentalForm instead.');
    
    // Redirect to rental form
    if (id) {
      navigate(`/rentals/${id}/edit`);
    } else {
      navigate('/rentals/new');
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
               type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const rentalData = {
        ...formData,
        managerId: 'default-manager', // Would need proper user context
        ownerId: 'default-owner', // Would need proper user context
        createdById: 'default-user' // Would need proper user context
      };

      if (id) {
        await rentalService.updateRental(id, rentalData);
      } else {
        await rentalService.createRental(rentalData);
      }

      navigate('/units');
    } catch (err: any) {
      setError(err.message || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <strong>⚠️ Deprecation Notice:</strong> This Unit Form is deprecated. 
        You are being redirected to the new Rental Form. 
        Units are now managed as part of the unified Rental system.
      </div>
      
      <h1>{id ? 'Edit Unit (Legacy)' : 'Add Unit (Legacy)'}</h1>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Property Type</label>
          <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
            <option value="APARTMENT">Apartment</option>
            <option value="HOUSE">House</option>
            <option value="CONDO">Condo</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Zip Code</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Rent</label>
          <input
            type="number"
            name="rent"
            value={formData.rent}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Unit Number</label>
          <input
            type="text"
            name="unitNumber"
            value={formData.unitNumber || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Floor Number</label>
          <input
            type="number"
            name="floorNumber"
            value={formData.floorNumber || 0}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Bedrooms</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms || 0}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Bathrooms</label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms || 0}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Size (sq ft)</label>
          <input
            type="number"
            name="size"
            value={formData.size || 0}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Deposit</label>
          <input
            type="number"
            name="deposit"
            value={formData.deposit || 0}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
            />
            Available
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (id ? 'Update Unit' : 'Create Unit')}
        </button>
      </form>
    </div>
  );
};

export default UnitForm;
