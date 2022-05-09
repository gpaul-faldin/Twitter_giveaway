const mongoose = require('mongoose')

const accSchema = new mongoose.Schema({
	user: String,
	pass: String,
	tag: String,
	user_id: String,
	mail: String,
	proxy: String,
	timeout: Boolean,
	end_timeout: Date,
	ini: Boolean,
	ini_follow: Boolean,
	last_action: Date,
	old: Boolean,
	copy_of: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: "copy_accounts"
	},
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