var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost/getmefood');
var User = new Schema({
	name : String,
	email : String,
	foods : [String]
});

var Food = new Schema({
	name : String,
	occurrence : Number
});

Food = mongoose.model("Food", Food);
User = mongoose.model("User", User);

function addGlobalFoods(list) {
	for (var i = 0; i < list.length; i++) {
		addItem(list[i]);
	}
}

function addItem(item) {
	Food.findOne({name:item}, function(err, doc) {
		if (doc === null) {
			// no entry found, so let's make it
			var newItem = new Food();
			newItem.name = item;
			newItem.occurrence = 1;
			newItem.save();
			console.log(newItem.name + " added");
		}
		else {
			doc.occurrence++;
			doc.save();
			console.log(doc.name + " updated: " + doc.occurrence);
		}
	});
}

function getUser(emailAddr, callback) {
	User.findOne({email:emailAddr}, callback);
}

function getGlobalFoods(callback) {
	Food.find({}, callback);
}

exports.getGlobalFoods = getGlobalFoods;
exports.addGlobalFoods = addGlobalFoods;
exports.getUser = getUser;
