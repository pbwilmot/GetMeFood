var mongoose = require("mongoose"),
	ObjectId = mongoose.ObjectId;

var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost/getmefood');
var User = new Schema({
	name : String,
	email : String,
	foods : [ String ]
});

var MenuFood = new Schema({
	name : String,
	score : Number,
	breakfast : Boolean,
	lunch : Boolean,
	dinner : Boolean,
	occurrence : Number,
	keywords : [String]
}).index({keywords:1});

var GlobalFood = new Schema({
	name : String,
	score : Number,
	occurrence : Number,
	keywords : [String]
}).index({keywords:1});

GlobalFood = mongoose.model("GlobalFood", GlobalFood);
MenuFood = mongoose.model("MenuFood", MenuFood);
User = mongoose.model("User", User);

var ignoredWords = ['on', 'w', 'with', 'dessert', 'a', 'to', 'the', 'and'];
var ignore = {};
for (var i = 0; i < ignoredWords.length; i++) {
	ignore[ignoredWords[i]] = true;
}

var synonyms = {'sr' : 'sour', 'mac' : 'macaroni'};

// expects a list of three String arrays: breakfast, lunch, and dinner menus
function addItems(itemList, collection, callback) {
	var counter = itemList[0].length + itemList[1].length + itemList[2].length;
	for (var i = 0; i < itemList.length; i++) {
		for (var j = 0; j < itemList[i].length; j++) {
			// now add this i
			var kw = parseKeywords(itemList[i][j]);
			var food = { name : itemList[i][j], keywords : kw };
			var prominence = j / itemList[i].length;
			collection.update({keywords : {$all : kw}}, {$set : food, $inc : { occurrence : 1, score : prominence }}, {upsert: true}, function(err, doc) {
				if (err)
					throw err;
				counter--;
				if (counter == 0)
					callback(err);
			});
		}
	}
}

function setMenu(itemList, callback) {
	var counter = 2;
	var func = function(err) {
		counter--;
		if (counter == 0)
			callback(err);
	};
	addItems(itemList, GlobalFood, func);
	MenuFood.remove({}, function(err) {
		addItems(itemList, MenuFood, func);
	});
	// TODO: Set breakfast, lunch, dinner for each MenuFood item
}

function parseKeywords(itemName) {
	var pattern = /[\w\'-]+/g;
	var word;
	var keywords = [];
	while ((word = pattern.exec(itemName)) != null) {
		var lower = word[0].toLowerCase();
		if (!ignore[lower]) {
			if (synonyms[lower] === undefined)
				keywords.push(lower);
			else
				keywords.push(synonyms[lower]);
		}
	}
	return keywords;
}

function matchKeywords(searchStr, collection, callback) {
	var kw = parseKeywords(searchStr);
	GlobalFood.find({keywords : {$all : kw}}, callback);
}

exports.User = User;
exports.MenuFood = MenuFood;
exports.GlobalFood = GlobalFood;
exports.setMenu = setMenu;
exports.matchKeywords = matchKeywords;
exports.parseKeywords = parseKeywords;
