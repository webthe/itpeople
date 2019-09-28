const query = require("../query");
const fs = require("fs");
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
const model = require("./../models/models");
const sql = require("../helpers/sql");
const orgName = "abeo";
const listofDocs = async (userID)=>{
    return new Promise(async (resolve, reject)=>{
        let invoke = await query.querypo(
            JSON.stringify({
              fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn3,
              args: [userID.toString()],
              channelName: cc_config[orgName].channels.channel1,
              orderergrpc: cc_config["orderer"].grpc,
              peergrpc: cc_config[orgName].grpc,
              hfckeystore: cc_config[orgName].hfckeyStore,
              chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
            })
          );
          if (invoke.length== 0) {
              return reject([]);
          }
          for(let i=0; i<invoke.length; i++) {
            let uploadeByName;
            if(invoke[i].uploadedByRole === "Practitioner") {
                uploadeByName = await sql.practitionerName(invoke[i].uploadedBy);
                console.log("uploadeByName "+i+"---"+uploadeByName);
            } else if(invoke[i].uploadedByRole === "Patient"){
                uploadeByName = await sql.patientName(invoke[i].uploadedBy);
            }
            invoke[i].uploadedBy = uploadeByName;
          }
          let result = model.statusSuccess(invoke, "");
          delete (result.transactionDetails)
          return resolve (result);
    });
}
const listofDocsPractitioner =  (patientID,userID)=>{
    return new Promise(async (resolve, reject)=>{
        let invoke = await query.querypo(
            JSON.stringify({
              fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn4,
              args: [patientID, userID.toString()],
              channelName: cc_config[orgName].channels.channel1,
              orderergrpc: cc_config["orderer"].grpc,
              peergrpc: cc_config[orgName].grpc,
              hfckeystore: cc_config[orgName].hfckeyStore,
              chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
            })
          );
         
          if (invoke.length== 0) {
                res.status(404).send(model.statusFail("No Records Found"));
                return reject([]);
          }
          invoke.forEach(patientDocs => {
               if(patientDocs.history.length >0) {
                    patientDocs.history.sort((a,b)=>{
                        return b.modifiedDate - a.modifiedDate;
                    });
                    patientDocs.accessStatus = patientDocs.history[0].accessStatus;
               }
               delete patientDocs.history
           });
         return resolve(invoke)
    });
}
module.exports = {
    listofDocs: listofDocs,
    listofDocsPractitioner: listofDocsPractitioner
}