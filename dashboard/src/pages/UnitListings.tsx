import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rentalService } from '../services/rentalService';

/**
 * @deprecated This component is deprecated. Use RentalListings instead.
 * Legacy unit listings page - redirects to rental listings with unit filter
 */

const UnitListings = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.warn('UnitListings component is deprecated. Use RentalListings instead.');
    
    const fetchUnits = async () => {
      try {
        setLoading(true);
        
        // Get rentals that represent units (have unitNumber)
        const response = await rentalService.getRentals({ 
          unitNumber: { not: null } 
        });
        
        setUnits(response.rentals);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch units');
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, []);

  if (loading) return <div>Loading units...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <strong>⚠️ Deprecation Notice:</strong> This Unit Listings page is deprecated. 
        Please use the new <Link to="/rentals">Rental Listings</Link> page instead.
        Units are now managed as part of the unified Rental system.
      </div>
      
      <h1>Unit Listings (Legacy)</h1>
      <Link to="/rentals/new">Add Rental Unit</Link>
      
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Type</th>
            <th>Rent</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id}>
              <td><Link to={`/rentals/${unit.id}`}>{unit.title}</Link></td>
              <td>{unit.status || 'Available'}</td>
              <td>{unit.propertyType}</td>
              <td>${unit.rent}</td>
              <td>{unit.address}, {unit.city}</td>
              <td>
                <Link to={`/rentals/${unit.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
          {units.length === 0 && (
            <tr>
              <td colSpan={6}>No units found. <Link to="/rentals/new">Create your first rental</Link></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnitListings;
