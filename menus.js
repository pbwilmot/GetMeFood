var http = require("http");

var ratty = '/Student_Services/Food_Services/eateries/refectory_menu.php';
var vdub = '/Student_Services/Food_Services/eateries/verneywoolley_menu.php';


var foodExp = /<td( width="[0-9]*")?>([^<]*)<\/td>/g;
var blank = /\s*&nbsp;\s*/;
var meal = /<h4>/g;

function getMenu(path, callback) {
	var options = {
		host: "www.brown.edu",
		port: 80,
		path: path
	};
	var pageText = "";
	var request = http.get(options, function(res) {
		res.setEncoding('utf8');
		res.on("data", function(chunk) {
			pageText += chunk;
		});
		res.on("end", function() {
			var items = parseMenu(pageText);
			callback(items);
		});
	});
	request.on("error", function(e) {
		console.log("Error: " + e.message);
	});
}

function parseMenu(pageText) {
	var meals = pageText.split(meal);
	var breakfast = meals[1];
	var lunch = meals[2];
	var dinner = meals[3];
	
	var food = [];
	for (var i = 1; i < 4; i++) {
		// meals 1-3 are breakfast, lunch, dinner
		food.push(removeDuplicates(parseFoodList(meals[i])));
	}
	
	return food;
}

function removeDuplicates(array) {
	var set = {};
	for (var i = 0; i < array.length; i++) {
		set[array[i]] = true;
	}
	var newArray = [];
	for (var item in set) {
		newArray.push(item);
	}
	return newArray;
}

function parseFoodList(foodText) {
	var result;
	var list = [];
	while ((result = foodExp.exec(foodText)) != null) {
		if (blank.exec(result[2]) == null) {// ignore &nbsp;
			result[2] = result[2].replace(/&amp;/, "&");
			list.push(result[2]);
		}
	}
	
	// Put them in alphabetical order
	list.sort(function(a,b) {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	return list;
}

exports.getRattyMenu = function(callback) {
	getMenu(ratty, callback);
};
/* This doesn't work yet exports.getVdubMenu = function(callback) {
	getMenu(vdub, calllback);
};*/
