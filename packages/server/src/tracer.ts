import tracer from 'dd-trace';
import p from '../package.json';
import fetch from 'sync-fetch';

tracer.init({
  version: p.version,
  env: process.env.ENVIRONMENT,
  service: p.name,
  hostname: fetch('http://169.254.169.254/latest/meta-data/local-ipv4'),
});

export default tracer;
