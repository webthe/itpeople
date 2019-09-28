const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const model = require("./../models/models");
const verifyAuthToken = require("../helpers/verifyAuth");
const sql = require("../helpers/sql");
const fs = require("fs");
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
const query = require("../query");
const chainCodeModel = require("../models/chaincodemodel");
var request = require('request');
require('dotenv').config();
router.use(verifyAuthToken);
router.get("/", async (req, res, next) => { 
    try {
        let orgName = "abeo";
        let userID = req.userID.toString();
        let documentID = req.query.documentID;
        let isPractitioner = await sql.isPractitioner(userID);
        let isPatient = await sql.isPatient(userID);
        console.log(isPractitioner +"===="+ isPatient);
        let role = '';
        if(isPatient) {
            role = 'Patient';
        } 
         if(isPractitioner) {
            role = 'Practitioner';
        } 
         if(isPatient && isPractitioner) {
            let str = documentID.split('-');
            if(str[1] === undefined) {
                res.status(404).send(model.statusFail("Invalid Document ID"));
            } else if(str[1]===userID) {
                role = 'Patient';
            }
        }
        console.log(role);
        let invoke = await query.querypo(
            JSON.stringify({
            fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn6,
            args: [documentID, userID, role],
            channelName: cc_config[orgName].channels.channel1,
            orderergrpc: cc_config["orderer"].grpc,
            peergrpc: cc_config[orgName].grpc,
            hfckeystore: cc_config[orgName].hfckeyStore,
            chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
            })
        );
        if(invoke.access === "OPEN") {
            console.log(process.env.IPFS_BASE_URL+invoke.fileHash);
            req.pipe(request(process.env.IPFS_BASE_URL+invoke.fileHash)).pipe(res)
        } else {
            res.status(401).send(model.statusFail("You are unauthorized to view/download the file"));
        }
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
});
module.exports = router;