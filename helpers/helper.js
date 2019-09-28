
const md5File = require('md5-file')
function mdHash (filePath) {
  return new Promise((resolve, reject)=>{
    md5File(filePath, (err, hash) => {
      if (err){
            const error = new Error('Invalid File')
            error.httpStatusCode = 500
            return next(error)        
      } else {
        return resolve(hash);
      }
    })
  });
}
var ipfsClient = require('ipfs-http-client');
const ipfs = new ipfsClient({host:'127.0.0.1', port:'5001', protocol: 'http'});
module.exports = {
  mdHash : mdHash,
  ipfs: ipfs
};
