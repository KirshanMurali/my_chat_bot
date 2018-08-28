var express        = require('express'),
    bodyParser     = require('body-parser'),
    https           = require('https'),
    request        = require('request'),
    app            = express(),
    fs             = require('fs'),
    token 	= 'EAACZC03ZAyZCXsBAMRazp9QZAoaE20rJaM0LwwFpn6iT8Cpk2EaZB6jpZCfpaNvVlmDQ13LhnxZCy0gM90ayD5hce5hSFZCBLNIWHf3cYvHuZBDiwZCEI3tRdlj6PwmNS0UKBAXFaq3j8kc5IHXvaMJweFrSSXhI1bXKBGps3JcAaFtIE9qmmfOLmK',
    sslOpts        = {
      "key":fs.readFileSync("/etc/letsencrypt/keys/0000_key-certbot.pem"),
      "cert":fs.readFileSync('/etc/letsencrypt/live/kirshan.tk/fullchain.pem')
    };

// accept JSON bodies.
app.use(bodyParser.json({}));

app.post('/fb', function(req, res){
  var id = req.body.entry[0].messaging[0].sender.id;
  var text = req.body.entry[0].messaging[0].message.text;
  console.log(JSON.stringify(req.body))
  app.speechHandler(text, id, function(speech){
    app.messageHandler(speech, id, function(result){
      console.log("Async Handled: " + result)
    })
  })
  res.send(req.body)
})

app.messageHandler = function(text, id, cb) {
  var data = {
    "recipient":{
    	"id":id
    },
    "message":{
    	"text":text
    }
  };
  var reqObj = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: data
  };
  console.log(JSON.stringify(reqObj))
  request(reqObj, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', JSON.stringify(error));
      cb(false)
    } else if (response.body.error) {
      console.log("API Error: " + JSON.stringify(response.body.error));
      cb(false)
    } else{
      cb(true)
    }
  });
}

app.speechHandler = function(text, id, cb) {
  var reqObj = {
    url: 'https://api.api.ai/v1/query?v=20150910',
    headers: {
      "Content-Type":"application/json",
      "Authorization":"Bearer 4485bc23469d4607b19a3d9d2d24b112"
    },
    method: 'POST',
    json: {
      "query":text,
      "lang":"en",
      "sessionId":id
    }
  };
  request(reqObj, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', JSON.stringify(error));
      cb(false)
    } else {
      console.log(JSON.stringify(body))
      cb(body.result.fulfillment.speech);
    }
  });
}

app.get('/fb', function(req, res) {
  if (req.query['hub.verify_token'] === 'abc') {
     res.send(req.query['hub.challenge']);
   } else {
     res.send('Error, wrong validation token');
   }
});

// create a health check endpoint
app.get('/health', function(req, res) {
  res.send('okay');
});

// set port
app.set('port', 443);

// start the server
https.createServer(sslOpts, app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});