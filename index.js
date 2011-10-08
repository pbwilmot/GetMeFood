var http = require("http");
var mustache = require("mustache");
var menus = require("./menus");
var db = require("./db");
var url = require("url");
var fs = require("fs");
var requestHandlers = require("./requestHandlers");
var express = require("express");
var email = require("./email");

var cookieSecret = "COOKIE MONSTER!!!!";

// Configuration

var app = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: cookieSecret}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get("/", requestHandlers.index);
app.get("/rattymenu", requestHandlers.rattymenu);
app.get("/clearusers", requestHandlers.clearusers);
app.get("/clearfoods", requestHandlers.clearfoods);
app.get("/listdb", requestHandlers.listdb);
app.get("/emailmatches", requestHandlers.emailmatches);
app.get("/matches", requestHandlers.matches);
app.get("/edit", requestHandlers.editGet);
app.get("/subscribed", requestHandlers.subscribed);
app.post("/edit", requestHandlers.editPost);
app.get('/unsubscribe', requestHandlers.unsubscribeGet);
app.post('/unsubscribe', requestHandlers.unsubscribePost);

function scheduleMessage() {
	var now = new Date();
	var millis = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0).getTime() - now.getTime();
	if (millis <= 0)
		millis += 1000 * 60 * 60 * 24;
	setTimeout(sendEmails, millis);
	console.log(now.toLocaleString());
}

function sendEmails() {
	menus.getRattyMenu(function(items) {
		// TODO: Add items to global list
		db.User.find({}, function(usererr, userdoc) {
			if (usererr)
				throw usererr;
			console.log("Sending matches...");
			
			for (var i = 0; i < userdoc.length; i++) {
				var matches = requestHandlers.getDailyMatches(userdoc[i], items);
				var data = { hasBreakfast : (matches[0].length > 0),
							hasLunch : (matches[1].length > 0),
							hasDinner : (matches[2].length > 0),
							breakfast : matches[0],
							lunch : matches[1],
							dinner: matches[2],
							name : userdoc[i].name,
							unsubscribeLink : "http://localhost:8080/unsubscribe?id=" + userdoc[i]._id };
							
				email.sendEmailWithTemplate(userdoc[i], "Today's Menu", "emailtemplate.txt", data, function(err, result) {});
				console.log("message sent to " + userdoc[i].email);
			}
		});
	});
	scheduleMessage();
}

scheduleMessage();
app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
