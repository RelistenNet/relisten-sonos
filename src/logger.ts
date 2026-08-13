import winston from 'winston';
import I from 'instrumental-agent';

type CustomLogger = winston.Logger & { I: typeof I };

const logger: CustomLogger = Object.assign(
  winston.createLogger({
    // format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
  { I }
);

I.configure({
  apiKey: process.env.INSTRUMENTAL_KEY,
  enabled: process.env.NODE_ENV === 'production',
});

export default logger;
