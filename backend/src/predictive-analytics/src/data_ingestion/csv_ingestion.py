import pandas as pd
from typing import List
import yaml
import os

def ingest_csv(file_paths: List[str]) -> pd.DataFrame:
    """
    Ingests data from a list of CSV files and concatenates them into a single DataFrame.

    Args:
        file_paths: A list of paths to the CSV files.

    Returns:
        A pandas DataFrame containing the combined data from the CSV files.
    """
    data_frames = [pd.read_csv(file_path) for file_path in file_paths]
    return pd.concat(data_frames, ignore_index=True)

def ingest_from_config(source_name: str, config_path: str = '../../config/config.yml') -> pd.DataFrame:
    """
    Ingests data for a named source as specified in the config.yml file.

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
    if source['type'] == 'csv':
        csv_path = os.path.join(os.path.dirname(config_path), source['path'])
        return pd.read_csv(csv_path)
    else:
        raise NotImplementedError(f"Only CSV ingestion is implemented. Got type: {source['type']}")
