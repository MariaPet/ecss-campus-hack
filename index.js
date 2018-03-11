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
            let sender = webhook_event.sender.id;
            if (webhook_event.postback && webhook_event.postback.payload === "Start"){
                console.log(webhook_event.postback.title);
                sendTextMessage(sender,"Hello and welcome to SotonBus Bot! You can ask me about upcoming buses for a specific bus stop or loop-up the closest bus stops to you by sending your location. Reply with 'Help' for more instructions.","location", "help")
                res.status(200).send('EVENT_RECEIVED');
            }
            else {
                console.log(webhook_event)
                if (webhook_event.message) {
                    let text = webhook_event.message.text?webhook_event.message.text.toLowerCase():"";
                    let payload = "";
                }
                else if (webhook_event.postback) {
                    let text = "";
                    let payload = webhook_event.postback.payload?webhook_event.postback.payload.toLowerCase():"";
                }
                
                console.log(webhook_event);
                if (text === "help") {
                    sendTextMessage(sender, "Here to help! To find the upcoming buses for a specific stop just text 'Stop' followed by the desired bus stop name e.g 'Stop Giddy Bridge'. To find the stops closest to you you can send your location.", "location")
                }
                if (webhook_event.message.attachments && webhook_event.message.attachments[0].type === "location") {
                    var latitude = webhook_event.message.attachments[0].payload.coordinates.lat
                    var longitude = webhook_event.message.attachments[0].payload.coordinates.long
                    var numberOfResultsReturned = 2;
    
                    
                    //sendTextMessage(sender, "Text received, echo: " + latitude + ","+longitude)
                    request('https://transportapi.com/v3/uk/bus/stops/near.json?app_id=552c4d0a&app_key=cf5a10e9aafbc058e660e49323985088&lat='+ latitude+'&lon='+longitude, function (error, response, body) {
                        var body = JSON.parse(body);
                        //sendTextMessage(sender, "Text received, echo: " + latitude + ","+longitude)
                        sendTextMessage(sender, body.stops.splice(0,4), null,null, "stops");
                        // for (var i = 0; i<6; i++){
                        //     sendTextMessage(sender, body.stops[i].name+" "+body.stops[i].distance + " meters");
                        // }  
                    })
                }
                else if (text.indexOf("stop") === 0 || payload.indexOf("stop") === 0) {
                    request('http://data.southampton.ac.uk/dumps/bus-info/2018-03-11/stops.json', function (error, response, body) {
                        console.log('error:', error); // Print the error if one occurred
                        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                        var body = JSON.parse(body)
                        var results = "";
                        var found = false;
                        var search_term = text.replace("stop ", "");
                        var bus = null;
                        if (search_term.indexOf("bus") >= 0) {
                            bus = search_term.split(" ").splice(-1,1);
                        }
                        
                        for (var i=0; i < body.length; i++) {
    
                            if (body[i].label.toLowerCase().indexOf(search_term) >= 0 ) {
                                
                                found = true;
                                results += JSON.stringify(body[i]);
    
                                request('https://transportapi.com/v3/uk/bus/stop/'+ body[i].id +'/live.json?app_id=552c4d0a&app_key=cf5a10e9aafbc058e660e49323985088&group=route&nextbuses=yes', function (error, response, stop){
                                    var stop = JSON.parse(stop);
                                    var stop_info = "";
                                    for (var key in stop.departures) {
                                        if (bus && key !== bus) {
                                            continue;
                                        }
                                        else if (bus && key === bus) {
                                            for (var j =0; j < stop.departures[key][0].length; j++) {
                                                if (j >= 3) {
                                                    break;
                                                }
                                                var departure_time = stop.departures[key][j].aimed_departure_time;
                                                var operator_name = stop.departures[key][j].operator_name;
                                                var direction = stop.departures[key][j].direction;
                                                var line_name = stop.departures[key][j].line_name;
                                                stop_info = "🚌"+operator_name + " " + line_name + "🚌\nBus stop: "  +stop.name + "\nDirection: " + direction + "\nDeparture time: "+ departure_time
                                                sendTextMessage(sender, stop_info);
                                            }
                                        }
                                        else {
                                            var departure_time = stop.departures[key][0].aimed_departure_time;
                                            var operator_name = stop.departures[key][0].operator_name;
                                            var direction = stop.departures[key][0].direction;
                                            var line_name = stop.departures[key][0].line_name;
                                            stop_info = "🚌"+operator_name + " " + line_name + "🚌\nBus stop: "  +stop.name + "\nDirection: " + direction + "\nDeparture time: "+ departure_time
                                            sendTextMessage(sender, stop_info);

                                        }
                                    }
                                    
    
                                })
                            }
                            // else if (body[i].label.toLowerCase().indexOf(text.toLowerCase()) > 1) {
                            //     sendTextMessage(sender, "Great! I found several stops with that name, which one do you want?" + JSON.stringify(body[i]))
                            // }
                        }
                        if (found === false){
                            results = "Oh-oh I could't find any bus stops with this name ";
                            sendTextMessage(sender,  results);
    
                        }
                        
                    });
                }
                res.status(200).send('EVENT_RECEIVED');
            }
            
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

function sendTextMessage(sender, text, location, help, stops) {
    console.log(location + " and " + help + " stops " +stops)
    console.log("text: " +text)
    let messageData = { text:text }
	if (!location && !help && !stops) {
        json= {
			recipient: {id:sender},
			message: messageData,
		}
    }
    else if(location || help){
        messageData.quick_replies = []
        if (location) {
            messageData.quick_replies.push({
                content_type: "location"
                // title: "Stop",
                // payload: "<POSTBACK_PAYLOAD>"
            });
        }
        if (help) {
            messageData.quick_replies.push({
                content_type: "text",
                title: "Help",
                payload: "<POSTBACK_PAYLOAD>"
            });
        }
        
        json= {
			recipient: {id:sender},
			message: messageData,
		}
    }
    else if (stops) {
        // messageData.text = "options"
        var elements = [];
        // messageData.quick_replies = []
        console.log(text)
        for (var i=0; i < text.length; i++) {
            elements.push({
                // content_type: "text",
                // title: text[i].name+" "+text[i].distance,
                // payload: "<POSTBACK_PAYLOAD>"
                // payload: "Stop " + text[i].name
                title: text[i].name+" "+text[i].distance + "meters",
                buttons: [
                    {
                        title: "Stop "+ text[i].name,
                        type: "postback",
                        payload: "Stop "+ text[i].name
                    }
                ]
            })
        }
      
        messageData = {
            // text: "test",
            attachment : {
                type: "template",
                payload: {
                    template_type: "list",
                    top_element_style: "compact",
                    elements: elements
                }
            }
        }
        json= {
			recipient: {id:sender},
			message: messageData,
        }
        console.log(json)
    }
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: json
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}