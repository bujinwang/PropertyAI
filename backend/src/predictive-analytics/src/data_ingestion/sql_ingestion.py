import pandas as pd
import sqlalchemy

def ingest_sql(query: str, connection_string: str) -> pd.DataFrame:
    """
    Ingests data from a SQL database using a specified query and connection string.

    Args:
        query: The SQL query to execute.
        connection_string: The database connection string.

    Returns:
        A pandas DataFrame containing the results of the query.
    """
    engine = sqlalchemy.create_engine(connection_string)
    return pd.read_sql(query, engine)
