var mongoose = require("mongoose"),
	ObjectId = mongoose.ObjectId;

var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost/getmefood');
var User = new Schema({
	name : String,
	email : String,
	foods : [ String ]
}).index({email:1});

var MenuFood = new Schema({
	name : String,
	score : Number,
	breakfast : Boolean,
	lunch : Boolean,
	dinner : Boolean,
	frequency : Number,
	keywords : [String]
}).index({keywords:1});

var GlobalFood = new Schema({
	name : String,
	score : Number,
	frequency : Number,
	keywords : [String]
}).index({keywords:1});

GlobalFood = mongoose.model("GlobalFood", GlobalFood);
MenuFood = mongoose.model("MenuFood", MenuFood);
User = mongoose.model("User", User);

var ignoredWords = [];//['on', 'w', 'with', 'dessert', 'a', 'to', 'the', 'and', 'in'];
var ignore = {};
for (var i = 0; i < ignoredWords.length; i++) {
	ignore[ignoredWords[i]] = true;
}

var synonyms = {'sr' : 'sour', 'mac' : 'macaroni', 'rasp' : 'raspberry' , '&' : 'and', 'w' : 'with'};

// Adds a list of foods to a given collection in the database
// itemList: a list of three String arrays: breakfast, lunch, and dinner menus, with no processing done on the individual menu item strings
// collection: which food collection to add it too (GlobalFood or MenuFood)
// callback: a function(err) which is called when this function completes
function addItems(itemList, partialKeywords, collection, callback) {
	var counter = itemList[0].length + itemList[1].length + itemList[2].length;
	var stop = false;
	for (var i = 0; i < itemList.length; i++) {
		for (var j = 0; j < itemList[i].length; j++) {
			// now add this i
			var kw = parseKeywords(itemList[i][j], false);
			if (partialKeywords)
				kw = getPartialKeywords(kw);
			var food = { name : itemList[i][j], keywords : kw };
			if (i == 0)
				food.breakfast = true;
			else if (i == 1)
				food.lunch = true;
			else
				food.dinner = true;
			var prominence = j / itemList[i].length;
			collection.update({keywords : {$all : kw, $size : kw.length }}, {$set : food, $inc : { frequency : 1, score : prominence }}, {upsert: true}, function(err) {
				if (err && !stop) {
					stop = true;
					callback(err);
				}
				if (!stop) {
					counter--;
					if (counter == 0)
						callback(null);
				}
			});
		}
	}
}

// Utility method
// Recreates the global food list based on the existing names
// This can adjust for changes in the schema without discarding all foods that have been entered
function updateGlobal() {
	GlobalFood.find({}, function(err, docs) {
		// TODO: Remove occurrence field
		for (var i = 0; i < docs.length; i++) {
			docs[i].keywords = getPartialKeywords(parseKeywords(docs[i].name), false);
			docs[i].frequency = 0;
			docs[i].score = 0;
			docs[i].save(function(err) { 
				if (err)
					console.log(err);
				else
					console.log("Database updated successfully");
			});
		}
	});
}

// Clears the previous MenuFood and loads it with a new menu. Also adds all new menu items to GlobalFood
// itemList: a list of three String arrays: breakfast, lunch, and dinner menus, where each menu is an array of raw strings containing menu items
// callback: a function(err) that is called when this function completes
function setMenu(itemList, callback) {
	var counter = 2;
	var stop = false;
	var func = function(err) {
		if (err && !stop) {
			stop = true;
			callback(err);
		}
		if (!stop) {
			counter--;
			if (counter == 0)
				callback(null);
		}
	};
	addItems(itemList, true, GlobalFood, func);
	MenuFood.remove({}, function(err) {
		if (err && !stop) {
			stop = true;
			callback(err);
		}
		if (!stop)
			addItems(itemList, false, MenuFood, func);
	});
}

// Parses a raw menu item string into a list of keywords. Returns the list of keywords as an array of strings
// For example, 'mac and cheese' would be become ['macaroni',cheese']
// itemName: a string containing the item to parse
function parseKeywords(itemName, lastPartial) {
	var pattern = /[&\w\'-]+/g;
	var word;
	var keywords = [];
	while ((word = pattern.exec(itemName)) != null) {
		index = pattern.lastIndex;
		var str = word[0].toLowerCase();
		if (!ignore[str]) {
			if (synonyms[str] !== undefined)
				str = synonyms[str];
			if (pattern.lastIndex != itemName.length || !lastPartial)
				str += " ";
			keywords.push(str);
		}
	}
	return keywords;
}

function getPartialKeywords(keywords) {
	var partials = [];
	for (var i = 0; i < keywords.length; i++) {
		for (var j = 1; j <= keywords[i].length; j++) {
			partials.push(keywords[i].substring(0, j));
		}
	}
	return partials;
}

// Gets all global foods that match a given string
// searchStr: The string to parse into keywords and search for
// collection: The collection to search; either MenuFood or GlobalFood
// callback: a function(doc, err) containing the results
function matchKeywords(searchStr, lastKeywordPartial, collection, callback) {
	var kw = parseKeywords(searchStr, lastKeywordPartial);
	if (kw.length == 0) {
		// Return empty for an empty string instead of returning everything
		callback(null, []);
		return;
	}
	var cond = {keywords : {$all : kw}};
	collection.find(cond, null, { limit: 10 }, function(err, doc) {
		if (err) {
			callback(err, null);
			return;
		}
		callback(null, doc);
	});
}

exports.User = User;
exports.MenuFood = MenuFood;
exports.GlobalFood = GlobalFood;
exports.setMenu = setMenu;
exports.matchKeywords = matchKeywords;
exports.updateGlobal = updateGlobal;
