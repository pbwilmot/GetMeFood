var email = require("mailer");
var db = require("./db");

function sendEmail(user, subj, msg, callback) {
	sendMessage(user.email, subh, msg, callback);
}

function sendMessage(address, subj, msg, callback) {
	email.send({
		host : "smtp.gmail.com",
		port : 465,
		to : address,
		from : "assassinatbrown@gmail.com",
		authentication : "login",
		ssl : true,
		username: "assassinatbrown@gmail.com",
  		password: "thefunhouse",
		subject : subj,
		body : msg},
		callback);
} 

function sendText(user, msg, callback) {
	sendMessage(user.phone + "@" + user.cellCarrier, null, msg, callback);
}

exports.sendEmail = sendEmail;
exports.sendText = sendText;
