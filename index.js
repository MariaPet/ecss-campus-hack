const express = require('express');
const bodyParser = require('body-parser')
const app = express();

const request = require('request')

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('hello');
        
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
            let sender = webhook_event.sender.id
            let text = webhook_event.message.text
            console.log(webhook_event)
            if (webhook_event.message.attachments && webhook_event.message.attachments[0].type === "location") {
                var latitude = webhook_event.message.attachments[0].payload.coordinates.lat
                var longitude = webhook_event.message.attachments[0].payload.coordinates.long
                sendTextMessage(sender, "Text received, echo: " + latitude + ","+longitude)
                var numberOfResultsReturned = 2;


                //sendTextMessage(sender, "Text received, echo: " + latitude + ","+longitude)
                request('https://transportapi.com/v3/uk/bus/stops/near.json?app_id=552c4d0a&app_key=cf5a10e9aafbc058e660e49323985088&lat='+ latitude+'&lon='+longitude, function (error, response, body) {
                    var body = JSON.parse(body)
                    //sendTextMessage(sender, "Text received, echo: " + latitude + ","+longitude)


                      sendTextMessage({
                        "content_type": "text",
                        "title": "Next1",
                        "payload": "Next"
                      });

                    if(webhook_event.message.quick_reply.payload === "Next" || webhook_event.message.title === "Next1")
                    {
                        var i = 0;
                        sendTextMessage("tEST");
                       while(numberOfResultsReturned >= 0)
                       {
                        sendTextMessage(sender, "Text received, echo: " + body.stops[i].stop_name + "at a distance of " + body.stops[i].distance)
                        numberOfResultsReturned--;
                        i++;
                       }
                    }

                    numberOfResultsReturned = 2;


                    /*
                    for (var i=0; i < body.stops.length; i++) {
                        sendTextMessage(sender, "Text received, echo: " + body.stops[i].stop_name)
                    }
                    */
                })
            }
            else {
                request('http://data.southampton.ac.uk/dumps/bus-info/2018-03-04/stops.json', function (error, response, body) {
                    console.log('error:', error); // Print the error if one occurred
                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    var body = JSON.parse(body)
                    var results = "";
                    var found = false;
                    for (var i=0; i < body.length; i++) {

                        if (body[i].label.toLowerCase().indexOf(text.toLowerCase()) >= 0 ) {
                            found = true;
                            results += JSON.stringify(body[i]);
                        }
                        if (found === false){
                            results = "Oh-oh I could't find any bus stops with this name ";
                        }
                        sendTextMessage(sender, "Text received, echo: " + results);
                        // else if (body[i].label.toLowerCase().indexOf(text.toLowerCase()) > 1) {
                        //     sendTextMessage(sender, "Great! I found several stops with that name, which one do you want?" + JSON.stringify(body[i]))
                        // }
                    
                    
                    }
                });
            }
            res.status(200).send('EVENT_RECEIVED');
        });
    } 
    else {
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