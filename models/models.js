function statusFail(message) {
    return ({
        status: "FAIL",
        message: message
    })
}
function statusSuccess(message, txid) {
    return ({
        status: "SUCCESS",
        message: message,
        transactionDetails: txid
    })
}

module.exports = {
    statusSuccess: statusSuccess,
    statusFail: statusFail
}