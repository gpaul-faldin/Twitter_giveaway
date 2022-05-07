/*
	REQUIRE
*/

const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
var handler = require('./routes.js');
require("dotenv").config();

/*
	INIT
*/

//////DB//////
mongoose.connect('mongodb://192.168.0.23:27017/Twitter');

//////CRON//////

require('./../srcs/cron/update_twitter.js')();
require('./../srcs/cron/check_timeout.js')();
require('./../srcs/cron/check_win_ga.js')();

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
app.post('/api/action-v2', handler.check_auth, handler.action_handler2)
app.post('/api/start', handler.check_auth, handler.start_handler)
app.post('/api/init', handler.check_auth, handler.init_handler)


//////RETRIEVE DATA//////
app.get('/api/retrieve/lowest', handler.check_auth, handler.retrieve_lowest_handler)
app.get('/api/retrieve/random', handler.check_auth, handler.retrieve_random_handler)
app.get('/api/retrieve/specific', handler.check_auth, handler.retrieve_spe_handler)
app.get('/api/retrieve/number', handler.check_auth, handler.retrieve_number)

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
const ga = require('../srcs/mongo/giveaway.js');
const cp = require('./../srcs/mongo/copy_accounts.js')
const {copy_profile} = require('../srcs/wrapper/twitter_wrapper.js')
const twit = require('../srcs/twitter_class.js')
const captcha2 = require('../srcs/wrapper/2captcha_wrapper')
const {actions, acc_manip} = require('../srcs/class.js')
const {setup_ga} = require('../srcs/setup_ga.js');
const { get_pp, get_banner, get_bio, get_legit, rm_img} = require('../srcs/wrapper/pro-fill_wrapper.js');
const screen = require("./../srcs/mongo/screen_ga.js");
const fs = require('fs')
const copy_account = require('./../srcs/scrap_accounts.js')

var tmp = new copy_account("1048018930785083392")


app.post('/api/test', async (req, res) => {
	var re = await cp.aggregate([{$sample: {size: 1}}]).then((x) => {return x[0]})
	//console.log(re)
	res.send(re)
})