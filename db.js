var mongoose = require("mongoose"),
	ObjectId = mongoose.ObjectId;

var Schema = mongoose.Schema;
var db = mongoose.connect('mongodb://localhost/getmefood');
var User = new Schema({
	name : String,
	email : String,
	foods : [ String ]
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

function addItem(itemName) {
	Food.findOne({name:itemName}, function(err, doc) {
		if (doc === null) {
			// no entry found, so let's make it
			var newItem = new Food();
			newItem.name = itemName;
			newItem.occurrence = 1;
			newItem.save();
			//console.log(newItem.name + " added");
		}
		else {
			doc.occurrence++;
			doc.save();
			//console.log(doc.name + " updated: " + doc.occurrence);
		}
	});
}

exports.addItem = addItem;
exports.addGlobalFoods = addGlobalFoods;
exports.User = User;
exports.Food = Food;
