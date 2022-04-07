const mongoose = require('mongoose')

const accSchema = new mongoose.Schema({
	user: String,
	pass: String,
	tag: String,
	mail: String,
	proxy: String,
	timeout: Boolean,
	ini: Boolean,
	info : {
		type: mongoose.SchemaTypes.ObjectId,
		ref: "twitter_infos"
	},
	cookies: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: "cookies"
	}
})

module.exports = mongoose.model("accounts", accSchema)