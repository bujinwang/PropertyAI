import pandas as pd
import sqlalchemy
import yaml
import os

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

def ingest_sql_from_config(source_name: str, config_path: str = '../../config/config.yml') -> pd.DataFrame:
    """
    Ingests data for a named SQL source as specified in the config.yml file.

    Args:
        source_name: The name of the data source (e.g., 'application_data').
        config_path: Path to the config.yml file.

    Returns:
        A pandas DataFrame containing the data from the specified source.
    """
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    source = config.get(source_name)
    if not source:
        raise ValueError(f"Source {source_name} not found in config.")
    if source['type'] != 'sql':
        raise ValueError(f"Source {source_name} is not of type 'sql'.")
    query = source['sql_query']
    connection_string = source['connection_string']
    engine = sqlalchemy.create_engine(connection_string)
    return pd.read_sql(query, engine)
