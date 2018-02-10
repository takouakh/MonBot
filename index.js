

'use strict'
const 
  express = require('express'),
  bodyParser = require('body-parser');
const request = require('request')
const AIMLInterpreter = require('aimlinterpreter');
let app = express();
app.use(bodyParser.urlencoded({"extended": false}));
app.use(bodyParser.json());



app.set('port', (process.env.PORT || 5000))

const token = process.env.FB_PAGE_ACCESS_TOKEN

app.get('/', function (req, res) { 
res.send('Dirty Code 12')
})


app.get('/Contact', function (req, res) { 
res.send('Contact Ensta Team')
})

app.get('/webhook/', function (req, res)
 { 
  if (req.query['hub.verify_token'] === 'takoua') {  res.send(req.query['hub.challenge']) } else {  res.send('Error, wrong token') }})

app.listen(app.get('port'), function() { 
console.log('running on port', app.get('port'))
})

app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      // Get the sender PSID
  let sender_psid = webhook_event.sender.id;
  console.log('Sender PSID: ' + sender_psid+'-'+body.last_name);

  // Check if the event is a message or postback and
  // pass the event to the appropriate handler function
  if (webhook_event.message) {
    handleMessage(sender_psid, webhook_event.message);        
  } else if (webhook_event.postback) {
    handlePostback(sender_psid, webhook_event.postback);
  }
     
     
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text":  getAiml(received_message.text)
    }
  }  
  
  // Sends the response message
  SendMessage(sender_psid, response);    
}


function SendMessage(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
 console.log("Log X :"+JSON.stringify(request_body)+"-----"+response);
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!-->'+JSON.stringify(request_body))
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}



function getAiml(request) {
  let  roboResponse='Hi' ;
  var aimlInterpreter = new AIMLInterpreter({name:'taha', age:'1 month', ufirst: 'Takoua', ulast: 'Kharroubi', gender: 'Female'});
  aimlInterpreter.loadAIMLFilesIntoArray(["responses/bot.aiml"]);
  aimlInterpreter.findAnswerInLoadedAIMLFiles(request.toUpperCase(), function(answer, wildCardArray, input){
    if(answer){
       roboResponse = answer;
    }else{
      roboResponse = "hmmm... I'm not sure what to say about that. Try saying help to see some options.";
    }
  });
  // Save user input and aiml output to dynamoDb
 // console.log(request.sender);
  //console.log(request.text + request.sender+ request.timestamp, roboResponse);
  return roboResponse;
}





function sendTextMessage(sender, text) { 
 let messageData = { text:text } 
 request({  
  url: 'https://graph.facebook.com/v2.6/me/messages',  
  qs: {access_token:token},  
  method: 'POST',  
  json: {   recipient: {id:sender},   message: messageData,
        } 
 }, function(error, response, body) { 
  if (error) {  
   console.log('Error sending messages: ', error)  
  } else if (response.body.error) { 
   console.log('Error: ', response.body.error)  
  } 
 })
}
