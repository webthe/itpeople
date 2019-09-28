const fs = require("fs");
let cc_config = JSON.parse(fs.readFileSync('connection.json', 'utf-8'));
let orgName = "abeo"
let chaincode  = ((fcn, args)=>{
    return ({
        fcn : fcn,
        args : args,
        channelName : cc_config[orgName].channels.channel1,
        orderergrpc :  cc_config["orderer"].grpc,
        peergrpc : cc_config[orgName].hfckeyStore,
        hfckeystore : cc_config[orgName].hfckeyStore,
        chaincodeID : cc_config[orgName].chaincodeID.chone_medicalrecords
    })
})

module.exports ={
    chaincode:chaincode
}