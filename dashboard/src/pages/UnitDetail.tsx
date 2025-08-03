import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rentalService } from '../services/rentalService';

/**
 * @deprecated This component is deprecated. Use RentalDetail instead.
 * Legacy unit detail page - redirects to rental detail
 */

interface Unit {
  id: string;
  name: string;
  status: string;
  type: string;
  rent: number;
  address: string;
  description: string;
  amenities: string[];
}

const UnitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.warn('UnitDetail component is deprecated. Use RentalDetail instead.');
    
    // Redirect to rental detail
    if (id) {
      navigate(`/rentals/${id}`);
    }
  }, [id, navigate]);

  useEffect(() => {
    const fetchUnit = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const rental = await rentalService.getRentalById(id);
        
        if (rental && rental.unitNumber) {
          // Map rental to unit format for backward compatibility
          setUnit({
            id: rental.id,
            name: rental.title,
            status: rental.status,
            type: rental.propertyType,
            rent: rental.rent,
            address: `${rental.address}, ${rental.city}, ${rental.state}`,
            description: rental.description || '',
            amenities: rental.amenities ? Object.keys(rental.amenities).filter(key => rental.amenities[key]) : []
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch unit');
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [id]);

  if (loading) {
    return <div>Loading unit details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!unit) {
    return <div>Unit not found</div>;
  }

  return (
    <div>
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <strong>⚠️ Deprecation Notice:</strong> This Unit Detail page is deprecated. 
        You are being redirected to the new <Link to={`/rentals/${id}`}>Rental Detail</Link> page.
        Units are now managed as part of the unified Rental system.
      </div>
      
      <h1>{unit.name}</h1>
      <p><strong>Status:</strong> {unit.status}</p>
      <p><strong>Type:</strong> {unit.type}</p>
      <p><strong>Rent:</strong> ${unit.rent}</p>
      <p><strong>Address:</strong> {unit.address}</p>
      <p><strong>Description:</strong> {unit.description}</p>
      
      <h3>Amenities:</h3>
      <ul>
        {unit.amenities.map(amenity => <li key={amenity}>{amenity}</li>)}
      </ul>
      
      <div>
        <Link to={`/rentals/${id}/edit`}>Edit Unit</Link> | 
        <Link to="/units">Back to Units</Link>
      </div>
    </div>
  );
};

export default UnitDetail;
