const mongoose = require('mongoose')

const GASchema = new mongoose.Schema({
	tweet_id: String,
	tweet_url: String,
	by: String,
	start: Date,
	draw: Date,
	conditions: {
		like: Boolean,
		rt: Boolean,
		tag: Number,
		follow: []
	},
	participate: Boolean,
	info: {
		nbr_acc: Number,
		acc: []
	}
})

module.exports = mongoose.model("giveaways", GASchema)