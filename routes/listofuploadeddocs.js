const express = require("express");
const router = express.Router();
bodyParser = require("body-parser").json();
const verifyAuthToken = require("../helpers/verifyAuth");
const sql = require("../helpers/sql");
const docsList = require("../helpers/docsList");
const model = require("../models/models");

router.use(verifyAuthToken);
router.get("/", async (req, res, next) => {
    try {
        let userID = req.userID;
        let patientID = req.query.patientID;
        let listofDocs = [];
        let isPractitioner = await sql.isPractitioner(userID);
        let isPatient = await sql.isPatient(userID);
        if(isPractitioner) {
            if(req.query.patientID === undefined){
                const error = new Error('Patiend ID is missing.')
                error.httpStatusCode = 400
                return next(error)
            }
            listofDocs = await docsList.listofDocsPractitioner(patientID,userID);
        } else if(isPatient){
            listofDocs = await docsList.listofDocs(userID);
        }
        if(listofDocs.length==0) {
            res.status(404).send(model.statusFail("No Data Found"));
        }
        let result = model.statusSuccess("", "");
        delete result.transactionDetails;
        delete result.message
        result.data = listofDocs
        res.status(200).send(result);
        
    } catch (error) {
        console.log(error)
    }
    
});
module.exports = router;


