var email = require("mailer");
var db = require("./db");

function sendEmail(user, subj, msg, callback) {
	sendMessage(user.email, subj, msg, callback);
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

function sendEmailWithTemplate(user, subj, templateFile, data, callback) {
	sendMessageWithTemplate(user.email, subj, templateFile, data, callback);
}

function sendMessageWithTemplate(address, subj, templateFile, dataObj, callback) {
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
		template : templateFile,
		data: dataObj},
		callback);
} 

function sendTextWithTemplate(user, templateFile, data, callback) {
	sendMessageWithTemplate(user.phone + "@" + user.cellCarrier, null, templateFile, data, callback);
}

exports.sendEmail = sendEmail;
exports.sendText = sendText;
exports.sendTextWithTemplate = sendTextWithTemplate;
exports.sendEmailWithTemplate = sendEmailWithTemplate;
