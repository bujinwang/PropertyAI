# Data Ingestion Utilities

This module provides utilities for ingesting data from CSV files and SQL databases, with support for configuration-driven ingestion for tenant screening predictive analytics.

## Usage

### Ingesting CSV Files
```python
from data_ingestion import ingest_csv

df = ingest_csv(["../data/raw/application_data.csv", "../data/raw/user_logs.csv"])
```

### Ingesting SQL Data
```python
from data_ingestion import ingest_sql

query = "SELECT * FROM applications"
connection_string = "postgresql://user:pass@host:port/db"
df = ingest_sql(query, connection_string)
```

### Ingesting Data from Config

Configure your data sources in `../../config/config.yml` (see framework_guide.md for schema examples).

#### Example (CSV):
```python
from data_ingestion import ingest_from_config

df = ingest_from_config('application_data')
```

#### Example (SQL):
```python
from data_ingestion import ingest_sql_from_config

df = ingest_sql_from_config('application_data')
```

- Supported source names: `application_data`, `user_logs`, `ai_outputs`, `system_logs`
- The config file determines whether CSV or SQL ingestion is used for each source. 