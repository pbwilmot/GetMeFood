var http = require("http");
var mustache = require("mustache");
var menus = require("./menus");
var db = require("./db");
var url = require("url");
var fs = require("fs");
var requestHandlers = require("./requestHandlers");
var express = require("express");
var email = require("./email");
var cron = require('./cron');

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
app.get("/listdb", requestHandlers.listdb);
app.get("/matches", requestHandlers.matches);
app.get("/edit", requestHandlers.editGet);
app.get("/subscribed", requestHandlers.subscribed);
app.post("/edit", requestHandlers.editPost);
app.get('/unsubscribe', requestHandlers.unsubscribeGet);
app.post('/unsubscribe', requestHandlers.unsubscribePost);
app.get('/autocomplete', requestHandlers.autocomplete);

db.updateGlobal();
cron.scheduleMessages();
app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
