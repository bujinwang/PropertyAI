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

def processing_time_per_stage(df: pd.DataFrame, id_col: str, stage_col: str, timestamp_col: str) -> pd.DataFrame:
    """
    Calculates processing time per application stage for each application.
    Args:
        df: The input DataFrame.
        id_col: The column identifying each application.
        stage_col: The column indicating the stage.
        timestamp_col: The column with timestamps.
    Returns:
        DataFrame with an added 'processing_time' column (in seconds).
    """
    df = df.sort_values([id_col, stage_col, timestamp_col])
    df['processing_time'] = df.groupby([id_col, stage_col])[timestamp_col].diff().dt.total_seconds()
    return df

def document_error_rate(df: pd.DataFrame, doc_status_col: str, id_col: str) -> pd.DataFrame:
    """
    Computes document error rate per application.
    Args:
        df: The input DataFrame.
        doc_status_col: The column indicating document verification status (e.g., 'error', 'success').
        id_col: The column identifying each application.
    Returns:
        DataFrame with an added 'doc_error_rate' column.
    """
    error_counts = df.groupby(id_col)[doc_status_col].apply(lambda x: (x == 'error').sum())
    total_counts = df.groupby(id_col)[doc_status_col].count()
    df['doc_error_rate'] = df[id_col].map((error_counts / total_counts).to_dict())
    return df

def data_consistency_score(df: pd.DataFrame, fields: list, id_col: str) -> pd.DataFrame:
    """
    Generates a data consistency score (e.g., % of non-null, valid fields) per application.
    Args:
        df: The input DataFrame.
        fields: List of fields to check for consistency.
        id_col: The column identifying each application.
    Returns:
        DataFrame with an added 'consistency_score' column (0-1).
    """
    def score(row):
        return sum(pd.notnull(row[f]) for f in fields) / len(fields)
    df['consistency_score'] = df.apply(score, axis=1)
    return df

def session_duration_and_navigation(df: pd.DataFrame, user_id_col: str, session_col: str, timestamp_col: str, action_col: str) -> pd.DataFrame:
    """
    Extracts session duration and navigation pattern features from user logs.
    Args:
        df: The input DataFrame.
        user_id_col: The column for user IDs.
        session_col: The column for session IDs.
        timestamp_col: The column with timestamps.
        action_col: The column with navigation actions.
    Returns:
        DataFrame with 'session_duration' and 'unique_actions' columns.
    """
    df[timestamp_col] = pd.to_datetime(df[timestamp_col])
    session_stats = df.groupby([user_id_col, session_col]).agg(
        session_start=(timestamp_col, 'min'),
        session_end=(timestamp_col, 'max'),
        unique_actions=(action_col, 'nunique')
    )
    session_stats['session_duration'] = (session_stats['session_end'] - session_stats['session_start']).dt.total_seconds()
    return session_stats.reset_index()

def deviation_from_typical_profile(df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    """
    Calculates the z-score deviation from the mean for each feature, per applicant.
    Args:
        df: The input DataFrame.
        feature_cols: List of feature columns to compute deviation for.
    Returns:
        DataFrame with added '<col>_zscore' columns for each feature.
    """
    for col in feature_cols:
        mean = df[col].mean()
        std = df[col].std()
        df[f'{col}_zscore'] = (df[col] - mean) / std
    return df
