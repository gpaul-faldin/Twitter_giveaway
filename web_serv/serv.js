/*
	REQUIRE
*/

const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const { actions, acc_manip } = require('./../srcs/class')
var common = require('../srcs/events/common');
var handler = require('./routes.js')


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

//////MISC//////
const app = express()
app.use(bodyParser.json());

/*
	EXPRESS
*/

app.get('/', (req, res) => {
	res.status(418).send("Lost ?")
})

//////ACTION RELATED//////

app.post('/api/action', handler.action_handler)
app.post('/api/start', handler.start_handler)

//////RETRIEVE DATA RELATED//////

app.get('/api/retrieve/lowest', handler.retrieve_lowest_handler)
app.get('/api/retrieve/random', handler.retrieve_random_handler)
app.get('/api/retrieve/specific', handler.retrieve_spe_handler)

app.listen(80)