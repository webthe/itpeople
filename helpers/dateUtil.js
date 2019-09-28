const moment = require('moment');
const momenttimezone = require('moment-timezone');
let today = moment().format("YYYY-MM-DD  h:mm:ss a");

var a = [
    {
      "name": "February",
      "plantingDate": "1569328294",
    },
    {
      "name": "March",
      "plantingDate": "1569328338",
    },
    {
      "name": "January",
      "plantingDate": "1569328317",
    }
  ]
  var b = [1569328294, 1569328338, 1569328317 ]
  b.sort(function(x,y){
    return x-y
  })
//   const test = moment.unix(1569326118 / 1000).format('DD-MM-YYYY HH:mm')
//   const date = moment(new Date(moment().unix())).format('DD-MM-YYYY HH:mm')
//   console.log(test +"---------------"+ moment().unix());

  const timestamp = moment('2019-02-15').unix();

  console.log(b[b.length-1]);
  console.log(moment.unix(timestamp).format('DD/MM/YYYY hh:mm:ss a'));
