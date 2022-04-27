const mongoose = require('mongoose')

const ScreenSchema = new mongoose.Schema({
	ga_tweet_id: String,
	image_id: String,
	base64_img: String
})

module.exports = mongoose.model("screen_ga", ScreenSchema)