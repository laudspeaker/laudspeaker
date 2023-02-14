/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process');
const dotenv = require('dotenv');
const { readdirSync } = require('fs');
const path = require('path');

dotenv.config();

const { K6_FRONTEND_URL, K6_BACKEND_URL } = process.env;
console.log('K6_FRONTEND_URL: ', K6_FRONTEND_URL);
console.log('K6_BACKEND_URL: ', K6_BACKEND_URL);

const createCommandString = (file) =>
  `docker run --rm -i loadimpact/k6 run - <./${file} -e FRONTEND_URL="${K6_FRONTEND_URL}" -e BACKEND_URL="${K6_BACKEND_URL}"`;

const proceedTest = (file) =>
  new Promise((resolve, reject) => {
    const child = exec(createCommandString(file), (err) => {
      if (err) reject(err);
    });

    child.stdout.on('data', (data) => {
      console.log(data);
    });
    child.stderr.on('data', (data) => console.error(data));
    child.on('exit', resolve);
  });

const files = readdirSync(path.join(__dirname, './')).filter(
  (name) => name.endsWith('.js') && name !== 'index.js'
);

(async () => {
  for (const file of files) {
    try {
      console.log(`Running ${file}...`);
      await proceedTest(file);
    } catch (e) {
      console.error(`${file} failed with error: ${e}`);
    }
  }
})();
