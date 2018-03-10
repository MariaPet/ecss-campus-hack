const express = require('express');
const bodyParser = require('body-parser')
const app = express();

var js = require('./functions.js');

const request = require('request')

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    // response = js.getBusesForStation();
    var request = require('request');
    request('https://transportapi.com/v3/uk/bus/stop/1980SN120405/live.json?app_id=552c4d0a&app_key=cf5a10e9aafbc058e660e49323985088&group=route&nextbuses=yes', function (error, response, body) {
     console.log('error:', error); // Print the error if one occurred
     console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
     
    var jsonToDisplay=JSON.parse(body)
    final = body.replace(jsonToDisplay,"")
     //console.log(jsonToDisplay);
     console.log(final);
     //console.log(response);
     //return final;
     res.send(body);
    });
        
    }
)

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];

        //console.log(webhook_event);

        let sender = webhook_event.sender.id
        let text = webhook_event.message.text
        sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        



        var resultJSON = myFunctions.getJSON();

        console.log(resultJSON);


        console.log(webhook_event);
        });

    
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
  
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "hugs_n_bugs"
    console.log( "hellooooo")
    // Parse the query params
    let mode = req.query['hub.mode'];
    console.log( req.query['hub.verify_token'])
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

app.listen(app.get('port'), () => console.log('App is listening to ' + app.get('port')));

// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.FB_PAGE_ACCESS_TOKEN
const token = "EAAdtvblxZCVUBANwVbkL08OvpjKJx9Y4iQnfl7VUVeD7qh1u0p3AUr4wgwXEhmN9GZAf8ZCMVt4kdF2svly6JlWZB93xt5dzhxwBNq9OGR7IDa5LRCqmr2c9VUST7SOKWeEVQI07A6brAFbNLy5N3pm9WFujJDZAjc6itXhuzSAZDZD"

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}