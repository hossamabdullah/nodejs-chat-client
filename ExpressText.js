
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

////////////////////////////
var session = require('express-session');
var  cookie = require('cookie');
var cookieParser = require('cookie-parser');
var sessionStore = new session.MemoryStore();
var COOKIE_SECRET = 'secret';
var COOKIE_NAME = 'sid';
/////////////////////////


///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
// app.use('/', express.static(__dirname + '/images'));
// app.set("images",__dirname+'/images');
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
var mobile;
//////////
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser(COOKIE_SECRET));
app.use(session({
    name: COOKIE_NAME,
    store: sessionStore,
    secret: COOKIE_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: null
    }
}));
// HTTP session cookie is set here
// Must appear after session middleware

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/index.html');
});

io.use(function(socket, next) {
    try {
        var data = socket.handshake || socket.request;
        if (! data.headers.cookie) {
            return next(new Error('Missing cookie headers'));
        }

        //1
        console.log('cookie header ( %s )', JSON.stringify(data.headers.cookie));
        var cookies = cookie.parse(data.headers.cookie);
        //2
        console.log('cookies parsed ( %s )', JSON.stringify(cookies));
        
        if (! cookies[COOKIE_NAME]) {
            return next(new Error('Missing cookie ' + COOKIE_NAME));
        }
        
        var sid = cookieParser.signedCookie(cookies[COOKIE_NAME], COOKIE_SECRET);
        if (! sid) {
            return next(new Error('Cookie signature is not valid'));
        }
        
        //3
        console.log('session ID ( %s )', sid);
        data.sid = sid;
        
        sessionStore.get(sid, function(err, session) {
            if (err) return next(err);
            if (! session) return next(new Error('session not found'));
            data.session = session;
            next();
        });
    } catch (err) {
        console.error(err.stack);
        next(new Error('Internal server error'));
    }
});
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

app.get('/confirm*',function(req,res){

    var request = require('request');



    request('http://localhost:8080/ChatWS/rest/service/confirm?mobile='+req.query.userkey+'&appKey=447ad97d40c592', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body +"you have successfully confirmed");
        res.sendFile(__dirname + '/mailConfirm.html');
      }
    })
});

app.get('/profile', function (req, res) {
	// if(mobile == undefined)
	// 	res.sendFile(__dirname + '/index.html');
	// else
  		res.sendFile(__dirname + '/profile.html');
});


app.get('/fail', function (req, res) {

  res.sendFile(__dirname + '/fail.html');

});


app.get('/', function (req, res) {


	// if(12 ==  req.query.id)
		// console.log("12");
  res.sendFile(__dirname + '/index.html');

});

app.get('*', function (req,res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){


  socket.on('chat message', function(msg,userMobile){
  	console.log("im innnn");

			var request = require('request');

			request.post({
			       url : 'http://localhost:8080/ChatWS/rest/service/profilepicture',
			       json: {'mobile' : userMobile, 'image': msg ,'appKey' : '447ad97d40c592' } },
				//form: {mobile : '99333'} 
			    function (error, response, body) {
			        if (!error && response.statusCode == 200) {
			            console.log(body)
                  socket.emit('photoUploaded');
                  console.log('done');
			        }else{
						console.log("error is "+body)
					}
			    }
			);
	});



  socket.on('sign in' , function(jsonUser){
  	
  	console.log(jsonUser);
	var request = require('request');

	var jsonUsers = JSON.parse(jsonUser);
    console.log(mobile);


	request('http://localhost:8080/ChatWS/rest/service/signin?user='+jsonUser+'&appKey=447ad97d40c592', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
      console.log(body + "aa");
	  	if(body == "true")
	  		socket.emit('login_success');
	  	else
	  		socket.emit('login_fail','invalid username or password');
	    // console.log(body) // Show the HTML for the Google homepage
	  }else{
	  	console.log('error is = '+error );
	  }
	});

  });




  socket.on('sign up',function(jsonUser){
	console.log("im in");
  	console.log(jsonUser);

  	//var userSignUpDto = {displayName:"Hossam",email:"email",mobile:"888888",fullName:"Full Name",password:"password"};

    

    var request = require('request');


    request('http://localhost:8080/ChatWS/rest/service/create?user='+jsonUser+'&appKey=447ad97d40c592', function (error, response, body) {
      if (!error && response.statusCode == 200) {
      	if(body=="true"){
      		console.log("registeration success");
      		socket.emit('register_success');
      	}
        else{
        	console.log("registeration fails");
        	socket.emit('register_fail','mobile number already exists');
        }
      }
    })
  });



  socket.on('get data',function(userMobile){


	var request = require('request');
  console.log(userMobile);

	request('http://localhost:8080/ChatWS/rest/service/getuser?mobile='+userMobile+'&appKey=447ad97d40c592', function (error, response, body) {
    if (!error && response.statusCode == 200) {

    //console.log(body) // Show the HTML for the Google homepage
  	var obj = JSON.parse(body);
  	if(obj=== null){
      console.log("object = null");
    }
      else{
    console.log(obj.displayName);
  	console.log(obj.email);
  	console.log(obj.mobile);
  	console.log(obj.fullName);
	// console.log(obj.profileImage);
	socket.emit('displayData' , body);
  }
	}})
  });

  socket.on('restorPw',function(restoreMobile){


	var request = require('request');
	console.log("im there");
  console.log(restoreMobile);
	request('http://localhost:8080/ChatWS/rest/service/restore?mobile='+restoreMobile+'&appKey=447ad97d40c592', function (error, response, body) {
    if (!error && response.statusCode == 200) {
	    //console.log(body) // Show the HTML for the Google homepage
	}})

  });


  socket.on('update data',function(jsonUser){

 //  	var userSignUpDto = {displayName:"Hossam",email:"email",mobile:"999999s",fullName:"Full Name",password:"password"};

	// var jsonUser = JSON.stringify(userSignUpDto);

	var request = require('request');
	var jsonnn = JSON.parse(jsonUser);
	console.log(jsonnn);
	mobile = jsonnn.mobile;
	console.log(mobile);

	console.log('update is on'+jsonUser);
	request('http://localhost:8080/ChatWS/rest/service/update?user='+jsonUser+'&appKey=447ad97d40c592', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
      console.log('update done');
	    //socket.emit('update done');
	  }
	})
  });

});


http.listen(3000, function () {

  console.log('listening on 3000')

})