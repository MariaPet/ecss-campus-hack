function getJSON()
{
    var request = require('request');
        request('https://transportapi.com/v3/uk/bus/stop/1980SN120405/live.json?app_id=552c4d0a&app_key=cf5a10e9aafbc058e660e49323985088&group=route&nextbuses=yes', function (error, response, body) {
          console.log('error:', error); // Print the error if one occurred
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          
          var jsonFile = body.replace(JSON.parse(body),"")
          

          return jsonFile; 
        
        });
}