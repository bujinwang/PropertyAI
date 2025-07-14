import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

def transform_data(df: pd.DataFrame, numerical_cols: list, categorical_cols: list) -> pd.DataFrame:
    """
    Applies scaling to numerical columns and one-hot encoding to categorical columns.

    Args:
        df: The input DataFrame.
        numerical_cols: A list of numerical column names.
        categorical_cols: A list of categorical column names.

    Returns:
        A DataFrame with transformed data.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(), categorical_cols)
        ],
        remainder='passthrough'
    )

    return preprocessor.fit_transform(df)
