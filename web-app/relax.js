'use strict';

module.exports = async () => {
  if (!process.env.ENV_VARS_SET) {
    const {env} = require('./env');

    for (const prop in env)
      process.env[prop] = env[prop];
  }
};