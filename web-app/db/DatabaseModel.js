'use strict';

const sql = require('mssql');
let instance = false;

class DatabaseModel {
  // @param handlers: array of pairs <String, callback(error)>
  constructor(handlers) {
    this.sql = sql;
    if (handlers && Array.isArray(handlers))
      for (const [handler, callback] of handlers)
        sql.on(handler, callback);
  }
  
  async connect() {
    const config = {
      user: process.env.db_ADMIN,
      password: process.env.db_PASSWORD,
      server: "upperdb.database.windows.net",
      database: "UpperDB",
      options: {
        encrypt: true,
      }
    };

    await sql.close();
    await sql.connect(config);
  }
}

function singleton(handlers) {
  if (!instance)
    instance = new DatabaseModel(handlers);
  return instance;
}

module.exports = DatabaseModel;