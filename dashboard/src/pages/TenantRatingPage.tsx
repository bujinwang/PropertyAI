import React, { useEffect, useState } from 'react';
import { getTenantRatings, createTenantRating } from '../services/tenantRating.api';
import { TenantRating } from '../types/tenantRating';

const TenantRatingPage: React.FC = () => {
  const [ratings, setRatings] = useState<TenantRating[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantRatings(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenantRatings = async (tenantId: string) => {
    try {
      const fetchedRatings = await getTenantRatings(tenantId);
      setRatings(fetchedRatings);
    } catch (error) {
      console.error('Error fetching tenant ratings:', error);
    }
  };

  const handleCreateRating = async () => {
    if (!selectedTenant || newRating === 0) {
      alert('Please select a tenant and provide a rating.');
      return;
    }

    try {
      await createTenantRating({
        tenantId: selectedTenant,
        rating: newRating,
        comment,
        // These values would typically come from the authenticated user and the tenant's lease
        raterId: 'property_manager_id', 
        leaseId: 'lease_id',
      });
      fetchTenantRatings(selectedTenant);
      setNewRating(0);
      setComment('');
    } catch (error) {
      console.error('Error creating tenant rating:', error);
    }
  };

  return (
    <div>
      <h1>Tenant Ratings</h1>
      <div>
        <label>Select Tenant:</label>
        <input
          type="text"
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          placeholder="Enter Tenant ID"
        />
      </div>
      <div>
        <h2>Rate Tenant</h2>
        <select value={newRating} onChange={(e) => setNewRating(Number(e.target.value))}>
          <option value={0} disabled>Select Rating</option>
          <option value={1}>1 Star</option>
          <option value={2}>2 Stars</option>
          <option value={3}>3 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={5}>5 Stars</option>
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
        />
        <button onClick={handleCreateRating}>Submit Rating</button>
      </div>
      <div>
        <h2>Ratings for {selectedTenant}</h2>
        <ul>
          {ratings.map((rating) => (
            <li key={rating.id}>
              <p>Rating: {rating.rating}</p>
              <p>Comment: {rating.comment}</p>
              <p>Rater: {rating.rater.firstName} {rating.rater.lastName}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TenantRatingPage;
