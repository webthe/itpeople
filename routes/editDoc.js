const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const model = require("./../models/models");
const verifyAuthToken = require("../helpers/verifyAuth");
const sql = require("../helpers/sql");
const helper = require("../helpers/helper");
const query = require("../query");
const fs = require("fs");
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
const invokeChainCode = require("../invokechaincode");
let multer = require("multer");
var ipfsClient = require("ipfs-http-client");
var path = require('path');
const ipfs = new ipfsClient({
  host: "127.0.0.1",
  port: "5001",
  protocol: "http"
});
var storage = multer.diskStorage({
  //multers disk storage settings
  destination: function(req, file, cb) {
    cb(null, "./files/");
  },
  filename: function(req, file, cb) {
    var datetimestamp = Date.now();
    cb(
      null,
      file.fieldname +
        "-" +
        datetimestamp +
        "." +
        file.originalname.split(".")[file.originalname.split(".").length - 1]
    );
  }
});

var upload = multer({
  //multer settings
  storage: storage,
  fileFilter: function(req, file, callback) {
    //file filter
    if (
      ["pdf", "doc", "docx", "png", "jpeg", "jpg"].indexOf(
        file.originalname.split(".")[file.originalname.split(".").length - 1]
      ) === -1
    ) {
      return callback(
        new Error(
          "Wrong extension type: JPG, PNG, PDF, doc and docx extensions are allowed to upload"
        )
      );
    }
    callback(null, true);
  }
}).single("file");

router.use(verifyAuthToken);
router.put("/deleteDoc", async (req, res, next) => {
    try {
        let documentID = req.query.documentID;
        let modifiedBy;
        let modifiedByRole;
        let patientID = req.query.patientID;
        let orgName = "abeo";
        let userID = req.userID.toString();
        //Practitioner delete patient uploaded documents
        if(patientID !== undefined) {
            modifiedBy = userID;
            modifiedByRole = "Practitioner"
            let isPractitionerActive = await sql.isUserActive(userID);
                if(!isPractitionerActive) {
                    res.status(403).send(model.statusFail("You are unauthorised to view the documents"));
                }    
        } else {
            modifiedBy = userID;
            modifiedByRole = "Patient"
            patientID = userID;
        } 
        console.log("modifiedBy "+modifiedBy)
        let invoke = await invokeChainCode.invoke(
            JSON.stringify({
                fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn5,
                args: [documentID, patientID, modifiedBy, modifiedByRole],
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
    
    res.status(200).send(model.statusSuccess("Successfully Deleted Medical Record", invoke));
  } 
    catch (error) {
        console.log(error)
        res.send(model.statusFail(error));
    }
});
router.post("/editDoc", upload, async (req, res, next) => {
    try {
        
        let documentID = req.body.documentID;
        let docCat = req.body.docCategory;
        let modifiedBy;
        let modifiedByRole;
        let patientID = req.body.patientID;
        let orgName = "abeo";
        let userID = req.userID.toString();
        
        if(documentID === undefined) {
            res.status(404).send(model.statusFail("Please select document"));
        }
        //Practitioner edit patient uploaded documents
        if(patientID !== undefined) {
            modifiedBy = userID;
            modifiedByRole = "Practitioner"
            let isPractitionerActive = await sql.isUserActive(userID);
                if(!isPractitionerActive) {
                    res.status(403).send(model.statusFail("You are unauthorised to edit the documents"));
                }    
        } else {
            modifiedBy = userID;
            modifiedByRole = "Patient"
            patientID = userID;
        } 
        console.log({
            patientID,userID,documentID,docCat
        })
        let fileHash;
        let fileExt;
        let mdhash;
        if(!req.file && !docCat) {
            res.send(model.statusFail("You did not made any change to the document"));
        }
        if(req.file !== undefined) {
           let file = req.file;
            mdhash= await helper.mdHash(file.path);
            console.log(mdhash);
            let fileExists = await query.querypo(
                JSON.stringify({
                    fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn2,
                    args: [mdhash, patientID],
                    channelName: cc_config[orgName].channels.channel1,
                    orderergrpc: cc_config["orderer"].grpc,
                    peergrpc: cc_config[orgName].grpc,
                    hfckeystore: cc_config[orgName].hfckeyStore,
                    chaincodeID: cc_config[orgName].chaincodeID.chone_medicalrecords
                })
              );
            if(fileExists) {
                res.status(400).send(model.statusFail("Duplicate File Entry."));
                return;
            }
            fileExt = (path.extname(file.path)).replace('.', '');
            const doc = fs.readFileSync(file.path);
            const fileAdded = await ipfs.add({
                path: file.path,
                content: doc
            });
            fileHash = fileAdded[0].hash;
            console.log(fileHash);
            if(fileHash == null) {
                const error = new Error('Error in uploading files.')
                error.httpStatusCode = 500
                return next(error)
            }
        }
       
        let medicalRecord= {
            patientID: patientID,
            documentID: documentID,
            filehash: fileHash,
            docCategory: docCat,
            documentExt: fileExt,
            mdhash: mdhash,
            modifiedBy: modifiedBy,
            modifiedByRole: modifiedByRole
        }
        console.log(medicalRecord);
        let invoke = await invokeChainCode.invoke(
                JSON.stringify({
                    fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn9,
                    args: [JSON.stringify(medicalRecord)],
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
        res.status(200).send(model.statusSuccess("Successfully Edited Medical Record", invoke));
    } catch (error) {
        console.log(error)
        res.send(model.statusFail(error));
    }
});
module.exports = router;