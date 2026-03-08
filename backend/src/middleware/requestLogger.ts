import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { httpRequestDuration, httpRequestTotal } from '../utils/metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const { method, path } = req;
    const { statusCode } = res;

    logger.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration: `${duration.toFixed(3)}s`,
    });

    // Record metrics
    httpRequestDuration.observe(
      { method, route: path, status_code: statusCode.toString() },
      duration
    );

    httpRequestTotal.inc({
      method,
      route: path,
      status_code: statusCode.toString(),
    });
  });

  next();
}
