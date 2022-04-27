const mongoose = require('mongoose')

const cookiesSchema = new mongoose.Schema({
	user: String,
	crsf: String,
	req_cookie: Array,
	cookies: Array
})

module.exports = mongoose.model("cookies", cookiesSchema)