import pandas as pd
from sklearn.impute import SimpleImputer

def handle_missing_values(df: pd.DataFrame, strategy: str = 'mean', columns: list = None) -> pd.DataFrame:
    """
    Handles missing values in a DataFrame using a specified strategy.

    Args:
        df: The input DataFrame.
        strategy: The imputation strategy. Can be 'mean', 'median', 'most_frequent', or 'constant'.
        columns: A list of columns to apply the imputation to. If None, applies to all numeric columns.

    Returns:
        A DataFrame with missing values handled.
    """
    imputer = SimpleImputer(strategy=strategy)
    
    if columns is None:
        columns = df.select_dtypes(include='number').columns
        
    df[columns] = imputer.fit_transform(df[columns])
    return df
