var mongoose = require("mongoose"),
	ObjectId = mongoose.ObjectId;

var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost/getmefood');
var User = new Schema({
	name : String,
	email : String,
	foods : [ { keywords: [String] } ]
});

var Food = new Schema({
	name : String,
	occurrence : Number,
	keywords : [String]
}).index({keywords:1});

Food = mongoose.model("Food", Food);
User = mongoose.model("User", User);

var ignoredWords = ['on', 'w', 'with', 'dessert', 'a', 'to', 'the', 'and'];
var ignore = {};
for (var i = 0; i < ignoredWords.length; i++) {
	ignore[ignoredWords[i]] = true;
}

// expects a list of three String arrays: breakfast, lunch, and dinner menus
function addItems(list) {
	var allitems = list[0].concat(list[1], list[2]);
	console.log(allitems);
	for (var i = 0; i < allitems.length; i++) {
		addItem(allitems[i]);
	}
}

function getKeywords(itemName) {
	var pattern = /[\w\'-]+/g;
	var word;
	var keywords = [];
	while ((word = pattern.exec(itemName)) != null) {
		var lower = word[0].toLowerCase();
		if (!ignore[lower])
			keywords.push(lower);
	}
	return keywords;
}

function addItem(itemName) {
	var kw = getKeywords(itemName);
	var food = { name : itemName, keywords : kw };
	console.log("updating " + JSON.stringify(kw));
	Food.update({keywords : {$all : kw}}, {$set : food, $inc : { occurrence : 1 }}, {upsert: true}, function(err, doc) {
		if (err)
			throw err;
	});
}

exports.addItem = addItem;
exports.addItems = addItems;
exports.User = User;
exports.Food = Food
