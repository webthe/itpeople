const sql = require('../database');
const { Pool } = require("pg");

const isUserActive = function(userID) {
    return new Promise((resolve, reject)=>{
        const query = {
            name: 'isUserActive',
            text: 'select is_active from auth_user where id= $1',
            values: [userID],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("SQL Error:" +err)
            } else {
               return resolve(res.rows[0].is_active) 
            }
        });
    });
}
const isPatient =  (userID)=>{
    return new Promise((resolve, reject)=>{
        const query = {
            name: 'isPatient',
            text: 'select count(*) from patient where user_id = $1',
            values: [userID],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("SQL Error:" +err)
            } else {
                console.log(res.rows[0])
                let isPatient =  (res.rows[0].count > 0) ? true: false;
                return resolve(isPatient);
            }
        });
    });
}
const isPractitioner =  (userID)=>{
    return new Promise((resolve, reject)=>{
        const query = {
            name: 'isPractitioner',
            text: 'select count(*) from practitioner where user_id = $1',
            values: [userID],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("SQL Error:" +err)
            } else {
                console.log(res.rows[0])
                let isPractitioner =  (res.rows[0].count > 0) ? true: false;
                return resolve(isPractitioner);
            }
        });
    });
}
const patientName = (userID)=>{
    return new Promise((resolve, reject)=>{
        let queryString = "select concat(first_name, ' ' ,last_name) as name from patient where user_id = $1;"
        const query = {
            name: 'patientName',
            text: queryString,
            values: [userID],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("SQL Error:" +err)
            } else {
                let result =  (res.rowCount > 0) ? true: false;
                if(result) {
                    return resolve(res.rows[0].name);
                } else {
                    return resolve("");
                }
            }
        });
    });
}
const practitionerName = (userID)=>{
    return new Promise((resolve, reject)=>{
        let queryString = "select concat(first_name, ' ' ,last_name) as name from practitioner where user_id = $1;"
        const query = {
            name: 'practitionerName',
            text: queryString,
            values: [userID],
        }
        sql.pool.query(query, (err, res)=>{
            if(err) {
                throw new Error("SQL Error:" +err)
            } else {
                let result =  (res.rowCount > 0) ? true: false;
                if(result) {
                    return resolve(res.rows[0].name);
                } else {
                    return resolve("");
                }
            }
        });
    });
}
module.exports = {
    isUserActive: isUserActive,
    isPatient: isPatient,
    isPractitioner: isPractitioner,
    patientName: patientName,
    practitionerName: practitionerName
}
