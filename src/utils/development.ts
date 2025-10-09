import env from '@/config/env/server';
import { logger } from '@/lib/logger';

const devLog = (...args: unknown[]) => {
  if (env.NODE_ENV === 'development') {
    logger.info('Development log', {
      args: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))),
    });
  }
};

export default devLog;
