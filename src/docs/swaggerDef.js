// import packageJson from '../../package.json' assert { type: 'json' };
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

const { version } = packageJson;
import config from '../config/config.js';


const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'node-express-boilerplate API documentation',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/hagopj13/node-express-boilerplate/blob/master/LICENSE',
    },
  },
  servers: [
    {
      url: `https://crm-apis.dharwinbusinesssolutions.com/v1`,
    },
  ],
};

export default swaggerDef;

