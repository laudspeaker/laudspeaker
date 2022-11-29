import tracer from 'dd-trace';
import p from '../package.json';

tracer.init({
  version: p.version,
  env: process.env.ENVIRONMENT,
  service: p.name,
});

export default tracer;
