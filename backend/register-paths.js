const path = require('path');
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: __dirname,
  paths: {
    'src/*': ['dist/*'],
    'generated/*': ['generated/*'],
  },
});