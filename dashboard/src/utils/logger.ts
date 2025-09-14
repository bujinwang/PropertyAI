import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'marketplace-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/marketplace.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;