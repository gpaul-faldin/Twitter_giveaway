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

/*
	TEST API
*/

const info = require("./../srcs/mongo/twitter_info.js")
const user = require("./../srcs/mongo/User.js");
const cookies = require('../srcs/mongo/cookies.js');
const {Webhook} = require('simple-discord-webhooks');
const twit = require('../srcs/twitter_class.js')
const webhook = new Webhook("https://discord.com/api/webhooks/963929665473482804/1j5BI8hClD-GolgKJdeVCV7_lpWPdcmaNIODqaV8OLhfrjWt8D9hIXfsmLQ539HxWeBS")


app.post('/api/test', async (req, res) => {
	var lst = await user.find().populate('cookies')
	for (let x in lst) {
		let twitter = new twit(lst[x].cookies.req_cookie, lst[x].cookies.crsf, lst[x].proxy.split(':'))
		if (await twitter.badge().then((x) => x.dm_unread_count) != 0) {
			//webhook.send(`${lst[x].user} won a giveaway ! <@259353316184555521>`)
		}
	}
	res.send("OK")
})