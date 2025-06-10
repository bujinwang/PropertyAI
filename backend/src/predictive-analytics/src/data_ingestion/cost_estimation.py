import pandas as pd
from sqlalchemy import create_engine
import os

def get_db_connection():
    """Establishes a connection to the database."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set.")
    return create_engine(db_url)

def fetch_repair_data(engine):
    """Fetches repair data from the database."""
    query = """
    SELECT
        mr.id as maintenance_request_id,
        mr."actualCost" as actual_cost,
        mr.description as repair_description,
        p.propertyType as property_type,
        p.yearBuilt as property_year_built,
        p.zipCode as property_zip_code,
        wo.priority as repair_priority,
        wo.createdAt as work_order_created_at,
        wo.completedAt as work_order_completed_at
    FROM "MaintenanceRequest" mr
    JOIN "Property" p ON mr.propertyId = p.id
    JOIN "WorkOrder" wo ON mr.id = wo.maintenanceRequestId
    WHERE mr."actualCost" IS NOT NULL;
    """
    return pd.read_sql(query, engine)

def main():
    """Main function to fetch and save repair data."""
    engine = get_db_connection()
    repair_data = fetch_repair_data(engine)
    repair_data.to_csv("repair_costs.csv", index=False)
    print("Repair data fetched and saved to repair_costs.csv")

if __name__ == "__main__":
    main()
