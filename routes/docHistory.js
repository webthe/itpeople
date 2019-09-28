const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const verifyAuthToken = require("../helpers/verifyAuth");
const sql = require("../helpers/sql");
const docsList = require("../helpers/docsList");
const model = require("../models/models");
const query = require("../query");
const orgName = "abeo";
const fs = require("fs");
const moment = require("moment")
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
router.use(verifyAuthToken);
router.get("/", async (req, res, next) => {
    try {
        let userID = req.userID;
        let documentID = req.query.documentID;
        let docHistory =[];
        let isPatient = await sql.isPatient(userID);
        if(!isPatient) {
            res.status(404).send(model.statusFail("Patient Data Found"));
            return;
        }
        let invoke = await query.querypo(
            JSON.stringify({
              fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn7,
              args: ["H"+documentID],
              channelName: cc_config[orgName].channels.channel1,
              orderergrpc: cc_config["orderer"].grpc,
              peergrpc: cc_config[orgName].grpc,
              hfckeystore: cc_config[orgName].hfckeyStore,
              chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
            })
          );
          if (invoke.length== 0) {
            res.status(404).send(model.statusFail("Document History Found"));
            return;  
          }
          for(let i=0; i<invoke.length; i++) {
            invoke[i].patienName = await sql.patientName(invoke[i].patientID);
            invoke[i].practitionerName  = await sql.practitionerName(invoke[i].practitionerID);
            invoke[i].createdDate = moment.unix(invoke[i].createdDate).format('DD-MM-YYYY HH:mm a');
            invoke[i].modifiedDate = moment.unix(invoke[i].modifiedDate).format('DD-MM-YYYY HH:mm a');
          }
          docHistory = invoke;
        res.status(200).send({
            status: "SUCCESS",
            data: docHistory
        });
    } catch (error) {
        console.log(error);
        res.send(model.statusFail(error));
    }
});
module.exports = router;
