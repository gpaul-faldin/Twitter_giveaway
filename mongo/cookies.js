const mongoose = require('mongoose')

const cookiesSchema = new mongoose.Schema({
	user: String,
	cookies:[]
})

module.exports = mongoose.model("cookies", cookiesSchema)