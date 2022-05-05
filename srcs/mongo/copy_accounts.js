const mongoose = require('mongoose')

const copy_acc_Schema = new mongoose.Schema({
	user_id: String,
	tag: String,
	username: String,
	base64_user: String,
	base64_banner: String,
	bio: String,
	ready: Boolean,
	used: Boolean
})

module.exports = mongoose.model("copy_account", copy_acc_Schema)