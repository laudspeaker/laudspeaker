import tracer from 'dd-trace';
import p from '../package.json';
import axios from 'axios';

tracer.init({
  version: p.version,
  profiling: true,
  env: process.env.ENVIRONMENT,
  service: p.name,
});

(async () => {
  try {
    const { data: hostname } = await axios.get(
      'http://169.254.169.254/latest/meta-data/local-ipv4'
    );
    tracer.setUrl(`http://${hostname}:8126`);
  } catch (e) {
    console.error(e);
  }
})();

export default tracer;
