const fetch = require("node-fetch");
const model = require("./../models/models");
const sql = require('../database');
const sqlhelper = require("../helpers/sql");
const authToken = async (url, headers) => {
  try {
    const response = await fetch(url, { headers: headers });
    const result = await response.json();
    console.log(result);
    return result;
  } catch (error) {
    throw new Error("" + error);
  }
};

// var verifyToken = function(req, res, next) {
//   try {
//     const result = authToken(url, req.headers.authorization);
//     if(!result.user_id) {
//         res.status(401).send(model.statusFail(result[0].message))    
//     }
//     next();
//   } catch (err) {
//     //throw new Error("Error in Middleware " + err);
//   }
// };


// module.exports = async function verifyToken(req, res, next) {
//     try {
//         const url = "http://99.79.122.221/verify/auth/token";
//         const headers = {
//             Authorization : req.headers.authorization
//         }
//         const response = await fetch(url, { headers: headers });
//         const result = await response.json();
//         console.log(result);
//         if(!result.user_id) {
//             res.status(401).send(model.statusFail(result.errors[0].message))    
//         }
//         req.userID = result.user_id;
//         next();
//       } catch (err) {
//         throw new Error("Error in Middleware " + err);
//       }
    
// }
function verifyToken(token) {
    return new Promise((resolve, reject)=>{
        const query = {
            name: 'verifyToken',
            text: 'select user_id from authtoken_token where key=$1',
            values: [token],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("DB Error " + err);
            } else {
               
                if(res.rowCount>0) {
                    //let userActive = sqlhelper.isUserActive(res.rows[0].user_id);
                    // console.log(res.rows[0].user_id);
                    // return resolve(res.rows[0].user_id);
                    let userActive =  (sqlhelper.isUserActive(res.rows[0].user_id)) ? true: false;
                    if(userActive) {
                        return resolve(res.rows[0].user_id);
                    } else {
                        return reject ("Invalid Token: User is Inactive");
                    }
                } else {
                    return reject ("Invalid Token");
                }
            }
        });
    });
}
module.exports =async (req, res, next)=>{
    try {
        let token = req.headers.authorization;
        req.userID = await verifyToken((token.replace('Token', "").trim()));
        next();
    } catch (error) {
        res.status(401).send(model.statusFail(error));
    }
}