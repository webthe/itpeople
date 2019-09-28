var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var testRouter = require('./routes/test');
var ipfsTestRouter = require('./routes/ipfstest');
var upaodDocsRouter = require('./routes/uploadDocs');
var listDocsRouter = require('./routes/listofuploadeddocs');
var editDocsRouter = require('./routes/editDoc');
var downloadRouter = require('./routes/downloadFile');
var docHistoryRouter = require('./routes/docHistory');
var setDocPermissionsRouter = require('./routes/setDocPermissions');
var app = express();
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(function(req, res, next) {
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
next();
});
//body parser middleware
app.use(bodyParser.json());


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/test', testRouter);
app.use('/ipfstest', ipfsTestRouter);
app.use('/api/v1/uploadDocs', upaodDocsRouter);
app.use('/api/v1/listDocs', listDocsRouter);
app.use('/api/v1/', editDocsRouter);
app.use('/api/v1/download', downloadRouter);
app.use('/api/v1/docHistory', docHistoryRouter);
app.use('/api/v1/setDocPermissions', setDocPermissionsRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    status: "FAIL",
    message: err.message
  });
});


module.exports = app;
