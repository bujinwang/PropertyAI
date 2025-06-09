import pandas as pd

def create_date_features(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """
    Creates date-related features from a date column.

    Args:
        df: The input DataFrame.
        date_column: The name of the column containing date information.

    Returns:
        A DataFrame with new date-related features.
    """
    df[date_column] = pd.to_datetime(df[date_column])
    df['year'] = df[date_column].dt.year
    df['month'] = df[date_column].dt.month
    df['day'] = df[date_column].dt.day
    df['weekday'] = df[date_column].dt.weekday
    return df
