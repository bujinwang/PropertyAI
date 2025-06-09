import pandas as pd
from typing import List

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
