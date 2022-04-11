const mongoose = require('mongoose')

const proxySchema = new mongoose.Schema({
	proxy: String,
})

module.exports = mongoose.model("proxies", proxySchema)