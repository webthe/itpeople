const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const model = require("./../models/models");
const verifyAuthToken = require("../helpers/verifyAuth");
const sql = require("../helpers/sql");
const fs = require("fs");
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
const invokeChainCode = require("../invokechaincode");
router.use(verifyAuthToken);
router.put("/", async (req, res, next) => {
    try {
        console.log("hello")
        let orgName = "abeo";
        let userID = req.userID.toString();
        let practitionerID = req.query.practitionerID;
        let permission = req.query.permission+"";
        
        if(typeof(permission) === "string") {
            Boolean(permission)
        }
        console.log(typeof(permission)+"====")
        let documentID = req.query.documentID;
        let isPatient = await sql.isPatient(userID);
        console.log({
            userID, practitionerID
            
        })
        if(!isPatient) {
            res.status(404).send(model.statusFail(userID+": is not a patient"));
            return;
        }
        let isPractitioner = await sql.isPractitioner(practitionerID);

        if(!isPractitioner) {
            res.status(404).send(model.statusFail(prctitionerID+": is not a practitioner"));
            return;
        }
        console.log("===", typeof(userID))
        let invoke = await invokeChainCode.invoke(
            JSON.stringify({
                fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn8,
                args: [userID, practitionerID.toString(), documentID, permission],
                channelName: cc_config[orgName].channels.channel1,
                orderergrpc: cc_config["orderer"].grpc,
                peergrpc: cc_config[orgName].grpc,
                hfckeystore: cc_config[orgName].hfckeyStore,
                chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
            })
        );
        if (invoke.length== 0) {
            const error = new Error('Error in chaincode.')
            error.httpStatusCode = 500;
            return next(error);
        }
        console.log(invoke);
        res.status(200).send(model.statusSuccess("Permission has been set successfully", invoke));
    } catch (error) {
        console.log(error)
        res.send(model.statusFail(error));
    }
});

module.exports = router;