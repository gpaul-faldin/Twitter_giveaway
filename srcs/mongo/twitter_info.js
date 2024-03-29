const mongoose = require('mongoose')

const cookiesSchema = new mongoose.Schema({
	user: String,
	info: Object,
	referTo: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: "accounts"
	}
})

module.exports = mongoose.model("twitter_infos", cookiesSchema)