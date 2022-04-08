/*
	REQUIRE
*/

const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const {acc_manip, info_manip} = require('./../srcs/class')
var handler = require('./routes.js')
require("dotenv").config();

/*
	INIT
*/

//////DB//////
global.db = (global.db ? global.db : mongoose.connect('mongodb://192.168.0.23:27017/Twitter'));

//////CLASS//////

class accounts extends acc_manip {
	constructor(user, pass, tag, mail, proxy, size, info) {
		this.user = user
		this.pass = pass
		this.tag = tag
		this.mail = mail
		if (proxy)
			this.proxy = proxy
		else
			this.proxy = ""
		this.size = size
		this.timeout = false
		this.init = false
		this.info = info
	}
}

//////MISC//////
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.text())

/*
	EXPRESS
*/

app.get('/', (req, res) => {
	res.status(418).send("Lost ?")
})

//////ACTION//////

app.post('/api/action', handler.check_auth, handler.action_handler)
app.post('/api/start', handler.check_auth, handler.start_handler)

//////RETRIEVE DATA//////

app.get('/api/retrieve/lowest', handler.check_auth, handler.retrieve_lowest_handler)
app.get('/api/retrieve/random', handler.check_auth, handler.retrieve_random_handler)
app.get('/api/retrieve/specific', handler.check_auth, handler.retrieve_spe_handler)

//////PUSH/UPDATE DATA//////

app.put('/api/update/twitter', handler.check_auth, handler.update_twitter_handler)

app.put('/api/add/proxy', (req, res) => {
	var body = req.body.split('\n\r\n')
	console.log(body[0])
	res.send("OK")
})

app.put('/api/add/account', (req, res) => {
	var body = req.body.split('\n\r\n')

	
})

app.put('/api/update/proxy', (req, res) => {

})

//////DELETE DATA//////

app.delete('/api/delete/account', (req, res) => {

})

app.delete('/api/delete/proxy', (req, res) => {
	
})

app.listen(process.env.PORT)