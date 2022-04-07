/*
	REQUIRE
*/

const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const user = require('./../mongo/User.js')
const cookies = require('./../mongo/cookies.js')
const { actions, acc_manip } = require('./../srcs/class')
const {main} = require('../main.js')
var common = require('../events/common');


/*
	INIT
*/

//////DB//////

mongoose.connect('mongodb://192.168.0.23:27017/Twitter')

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
	async write_file(acc) {
		fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), { flags: "w" });
	}
	getRandom(arr, n) {
		var len = arr.length;
		if (n > len)
			n = len
		var result = new Array(n);
		var taken = new Array(len);
		var size = n;
		while (n--) {
			var x = Math.floor(Math.random() * len);
			result[n] = arr[x in taken ? taken[x] : x];
			taken[x] = --len in taken ? taken[len] : len;
		}
		for (let x in result) {
			result[x].size = size
		}
		return result;
	}
	username_arr(acc) {
		var re = []
		for (let i in acc) {
			if (acc[i].tag.length != 0)
				re.push(acc[i].tag.substring(1))
		}
		return (re)
	}
	async update_info(acc) {
		var nfo = await twit.re_users_follow(this.username_arr(acc))
		for (let i in acc) {
			for (let x in nfo) {
				if (acc[i].tag.substring(1) == x) {
					nfo[x].followers.arr = acc[i].info.followers.arr
					acc[i].info = nfo[x]
					break;
				}
			}
		}
		await this.write_file(acc)
	}
	async update_follow_list(acc) {
		for (let x in acc) {
			if (acc[x].info.followers.arr.length == 0 && acc[x].info.followers.nbr != 0) {
				let re = await twit.get_followers(acc[x].info.id)
				if (re.length != 0)
					acc[x].info.followers.arr = re
				else
					break;
			}
		}
	}
	set_init_true(acc) {
		for (let x in acc) {
			acc[x].init = true
		}
	}
	acc_from_user(user) {
		var re = []
		for (let x in acc) {
			for (let w in user) {
				if (acc[x].user == user[w]) {
					if (re.includes(acc[x]) == false)
						re.push(acc[x])
					break;
				}
			}
		}
		return (re)
	}
}

//////GLOBAL//////
var IN_USE = false
var MAX_THREAD = 15

//////MISC//////
const app = express()
app.use(bodyParser.json());
var action = new actions(MAX_THREAD)


/*
	EVENTS
*/
var commonEmitter = common.commonEmitter;
commonEmitter.on("finish", data => {
	IN_USE == true ? IN_USE = false : 0
});

/*
	EXPRESS
*/

app.get('/', (req, res) => {
	res.status(418).send("Lost ?")
})

app.post('/api/action', async (req, res) => {
	if (IN_USE == false) {

		try {
			await action.parse_query(req.query, req.body)
		} catch (e) {
			return (res.status(400).send(e.message))

		}
		action.info.ready = true
		res.send(`Action is ready`)
	}
	else {
		res.status(503).send(`Service already in use`)
	}
})

app.post('/api/start', async (req, res) => {
	var body = req.body
	var manip = new acc_manip

	if (IN_USE == false) {
		if (Object.keys(body).length === 0)
			return (res.status(400).send("No body found"))
		if (!body.mode)
			return (res.status(400).send("Missing mode field in body"))
		if (action.info.ready == false)
			return (res.status(400).send("Actions are not setup"))
		switch (body.mode) {
			case 'rand':
				var arr = await manip.getRandom(action.info.nbr_acc).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			case 'lowest':
				if (body.opt != "1" && body.opt != "2")
					return res.status(400).send(`opt must be 1 (following) or 2 (followers) for mode lowest`)
				body.opt == 1 ? body.opt = "following" : body.opt = "followers"
				var arr = await manip.lowest(action.info.nbr_acc, body.opt).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			case 'spe':
				var arr = await manip.get_spe(body.opt).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
		}
		IN_USE = true
		main(arr, action)
		action = new actions(MAX_THREAD)
		return (res.send("OK"))
	}
	return (res.status(503).send('Bot already in use'))
})

app.get('/api/retrieve/lowest', async (req, res) => {
	if (!req.query.opt)
		return res.status(400).send(`opt must be specified`)
	var manip = new acc_manip
	var qty = await manip.get_size()
	var opt = ""
	if (req.query.qty) {
		if (!Number(req.query.qty))
			return res.status(400).send(`qty type must be Number`)
		qty = req.query.qty
	}
	if (req.query.opt != "1" && req.query.opt != "2")
		return res.status(400).send(`opt must be 1 (following) or 2 (followers)`)
	req.query.opt == 1 ? opt = "following" : opt = "followers"
	if (!req.query.output)
		return res.send(await manip.lowest(qty, opt).then(async (arr) => await manip.id_array_to_acc(arr)))
	return res.send(await manip.lowest(qty, opt).then(async (arr) => await manip.id_to_X(req.query.output, arr)))
})

app.get('/api/retrieve/random', async (req, res) => {
	var manip = new acc_manip
	var qty = await manip.get_size()
	if (req.query.qty) {
		if (!Number(req.query.qty))
			return res.status(400).send(`qty type must be Number`)
		qty = req.query.qty
	}
	if (!req.query.output)
		return res.send(await manip.getRandom(qty).then(async (arr) => await manip.id_array_to_acc(arr)))
	return (res.send(await manip.getRandom(qty).then(async (arr) => await manip.id_to_X(req.query.output, arr))))
})

app.get('/api/retrieve/specific', async (req, res) => {
	var manip = new acc_manip
	if (!req.query.tag)
		return (res.status(400).send(`tag(s) must be specified`))
	var re = await manip.get_spe(req.query.tag)
	if (!req.query.output)
		return (res.send(await manip.id_array_to_acc(re)))
	return (res.send(await manip.id_to_X(req.query.output, re)))
})

app.listen(8080)