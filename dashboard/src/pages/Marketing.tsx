import React from 'react';
import { Link } from 'react-router-dom';

const Marketing = () => {
  return (
    <div>
      <h1>Marketing Dashboard</h1>
      <div>
        <Link to="/marketing/campaigns">
          <button>Manage Advertising Campaigns</button>
        </Link>
        <Link to="/marketing/analytics">
          <button>View Website Analytics</button>
        </Link>
        <Link to="/marketing/promotions">
          <button>Create & Manage Promotions</button>
        </Link>
        <Link to="/marketing/syndication">
          <button>Listing Syndication Settings</button>
        </Link>
      </div>
    </div>
  );
};

export default Marketing;
