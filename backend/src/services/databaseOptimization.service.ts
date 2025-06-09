import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to identify slow queries
export const identifySlowQueries = async (threshold: number) => {
  try {
    // This is a simplified example. In a real-world scenario, you would use a more sophisticated method
    // to identify slow queries, such as enabling slow query logging in your database and parsing the logs.
    const result = await prisma.$queryRaw`
      SELECT
        pid,
        age(clock_timestamp(), query_start),
        usename,
        query
      FROM
        pg_stat_activity
      WHERE
        state = 'active'
        AND age(clock_timestamp(), query_start) > interval '${threshold} seconds'
      ORDER BY
        age(clock_timestamp(), query_start) DESC;
    `;
    return result;
  } catch (error) {
    console.error('Error identifying slow queries:', error);
    throw error;
  }
};

// Function to analyze a slow query
export const analyzeQuery = async (query: string) => {
  try {
    const result = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`);
    return result;
  } catch (error) {
    console.error('Error analyzing query:', error);
    throw error;
  }
};
