const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const fs = require("fs");
let multer = require("multer");
var ipfsClient = require("ipfs-http-client");
const model = require("./../models/models");
const verifyAuthToken = require("../helpers/verifyAuth");
const moment = require("moment");
const sql = require("../helpers/sql");
const helper = require("../helpers/helper");
var path = require('path');
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
const invokeChainCode = require("../invokechaincode");
const query = require("../query");
const md5File = require('md5-file/promise')
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
router.post("/", upload, async (req, res, next) => {
  try {
     //from token 
    let userID = req.userID;
    let orgName = "abeo";
    let today = moment().format("YYYY-MM-DD");
    let patientID = req.body.patientID;
    let isPractitionerActive = await sql.isUserActive(userID);
    let isPatientActive = await sql.isUserActive(patientID);
    let uploadedByRole = "Patient";
    if(!isPatientActive) {
        res.status(403).send(model.statusFail("User is inactive and documents upload can't be processed."));
    }
    if(""+userID !== patientID) {
      
      if(!isPractitionerActive) {
        res.status(403).send(model.statusFail("You are unauthorised to uplaod the documents"));
      } else {
        uploadedByRole = "Practitioner";
      }
    }
    console.log("uploadedByRole "+uploadedByRole)
    let fileHash = null;
    let documentID = moment().unix()+"-"+patientID;
    let docCat = req.body.docCategory;
    let file = req.file;
    if (!file) {
        const error = new Error('Please choose file.')
        error.httpStatusCode = 400
        return next(error)
    }
    const doc = fs.readFileSync(file.path);
   
     let mdhash= await helper.mdHash(file.path);
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
    let fileExt = (path.extname(file.path)).replace('.', '');
    const fileAdded = await ipfs.add({
        path: file.path,
        content: doc
    });
    fileHash = fileAdded[0].hash;
    if(fileHash == null) {
        const error = new Error('Error in uploading files.')
        error.httpStatusCode = 500
        return next(error)
    }
    let medicalRecord= {
        patientID: patientID,
        documentID: documentID,
        documentType: "medicalRecord",
        filehash: fileHash,
        uploadedDate: today,
        uploadedBy: userID,
        modifiedDate: "",
        modifiedBy: "",
        status: "ACTIVE", 
        docCategory: docCat,
        documentExt: fileExt,
        mdhash: mdhash,
        uploadedByRole: uploadedByRole 
    }
    
    let invoke = await invokeChainCode.invoke(
        JSON.stringify({
            fcn: cc_config[orgName].chaincode["chone_medicalrecords"].fcn1,
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
    
    res.status(200).send(model.statusSuccess("Successfully Added Medical Record", invoke));
  } catch (error) {
      console.log(error)
    res.status(401).send(model.statusFail(error));
  }
});
module.exports = router;
