
const sql = require('mssql')
const fs = require('fs');

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
      user: 'Gatea',
      password: 'kiwiFOARTEAMAR_13',
      server: "upperdbserver.database.windows.net",
      database: "UpperDatabase",
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
async function parse()
{
    for(var i=1;i<100;++i){
        fs.readFile('a'+i+'.json', (err, data) => {  
            if (err) throw err;
            let curr_entry = JSON.parse(data);
            if(curr_entry[0]!=null)
            {
                let curr_emotion = curr_entry[0].faceAttributes.emotion;
                console.log(curr_emotion);
            
            db.connect()
            .then(() => {
                return db.sql.query`
                insert into emotions(anger, contempt, disgust, fear, happiness, neutral, sadness)
                values(${curr_emotion.anger}, ${curr_emotion.contempt},${curr_emotion.disgust}, ${curr_emotion.fear}, ${curr_emotion.happiness}, ${curr_emotion.neutral}, ${curr_emotion.sadness})
                select scope_identity();
            `;
            })
            .then(result => {
                const sessionId = result.recordset[0][""];

                deviceControl.startDeviceTelemetry(device_id, childId, sessionId, (error, result) => {
                if (error && error.message)
                    return res.json({error: error.message});
                return res.json({result});
                });
            })
            .catch(error =>  {
                res.json({error})
            });
                    
                });
            }
}
parse();
