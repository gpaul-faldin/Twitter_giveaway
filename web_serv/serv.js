/*
	REQUIRE
*/

const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
var handler = require('./routes.js');
const User = require('../srcs/mongo/User.js');
require("dotenv").config();

/*
	INIT
*/

//////DB//////
mongoose.connect('mongodb://192.168.0.23:27017/Twitter');

//////CRON//////
require('./../srcs/cron/update_twitter')();

//////MISC//////
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.text())

/*
	EXPRESS
*/

app.listen(process.env.PORT)

app.get('/', (req, res) => {
	res.status(418).send("Lost ?")
})

//////ACTION//////
app.post('/api/action', handler.check_auth, handler.action_handler)
app.post('/api/start', handler.check_auth, handler.start_handler)
app.post('/api/init', handler.check_auth, handler.init_handler)

//////RETRIEVE DATA//////
app.get('/api/retrieve/lowest', handler.check_auth, handler.retrieve_lowest_handler)
app.get('/api/retrieve/random', handler.check_auth, handler.retrieve_random_handler)
app.get('/api/retrieve/specific', handler.check_auth, handler.retrieve_spe_handler)

//////ADD DATA//////
app.put('/api/add/account', handler.check_auth, handler.add_account)
app.put('/api/add/proxy', handler.check_auth, handler.add_proxy)

//////UPDATE DATA//////
app.put('/api/update/twitter', handler.check_auth, handler.update_twitter_handler)
app.put('/api/update/proxy', handler.check_auth, handler.update_proxy)

//////DELETE DATA//////
app.delete('/api/delete/proxy', handler.check_auth, handler.proxy_delete)
app.delete('/api/delete/account', handler.check_auth, handler.account_delete)

const info = require("./../srcs/mongo/twitter_info.js")
const user = require("./../srcs/mongo/User.js")

app.post('/api/test', async (req, res) => {

	//await user.updateOne({ user: req.query.user }, {$set: {referTo: await info.findOne({ user: req.query.user })}})
	//await info.updateOne({ user: req.query.user }, {$set: {referTo: await user.findOne({ user: req.query.user })}})
	res.send("OK")
})