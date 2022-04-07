/*
	REQUIRE
*/
var chance = require('chance').Chance()
const {StaticPool} = require("node-worker-threads-pool");
const fs = require('fs');
const {follow} = require('./srcs/twitter_wrapper.js')
var common = require('./events/common');
var commonEmitter = common.commonEmitter;


/*
	INIT
*/

	//////CLASS//////

class	accounts {
	constructor(user, pass, tag, mail, proxy, info, cookies) {
		this.user = user
		this.pass = pass
		this.tag = tag
		this.mail = mail
		if (proxy)
			this.proxy = proxy
		else
			this.proxy = ""
		this.timeout = false
		this.init = false
		this.info = info
		this.cookies = cookies
	}
	async write_file(acc) {
		fs.writeFileSync(__dirname + `/db/acc.json`, JSON.stringify(acc, null, '	'), {flags:"w"});
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
					break ;
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
					break ;
			}
		}
	}
	lowest_followers(acc, nbr) {
		var i = 0
		var save = []
		var re = []
		while (i < nbr) {
			var n = 0
			var lowest = 100
			for (let x in acc) {
				if (acc[x].info.followers < lowest && save.includes(x) == false) {
					n = x
					lowest = acc[x].info.followers
				}
			}
			save.push(n)
			re.push(acc[n])
			i++;
		}
		for (let x in re)
			re[x].size = re.length
		return (re)
	}
	lowest_following(acc, nbr) {
		var i = 0
		var save = []
		var re = []
		while (i < nbr) {
			var n = 0
			var lowest = 100
			for (let x in acc) {
				if (acc[x].info.following < lowest && save.includes(x) == false) {
					n = x
					lowest = acc[x].info.following
				}
			}
			save.push(n)
			re.push(acc[n])
			i++;
		}
		for (let x in re)
			re[x].size = re.length
		return (re)
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
					break ;
				}
			}
		}
		return (re)
	}
}

class	proxy_stat {
	constructor(proxy, size) {
		this.proxy = proxy,
		this.state = 0,
		this.used = 0,
		this.max = 0
		this.size = size
	}
	status() {
		if (this.state)
			this.state = 0
		else {
			this.state = 1
			this.used++
		}
	}
	max_use() {
		if (this.max != 0) {
			if (this.used == this.max)
				return (1);
			return (0);
		}
		return (0);
	}
}

class	actions {
	constructor() {
		this.url = "",
		this.rt = false,
		this.like = false,
		this.tag = {
			'on' : false,
			'nbr' : 0
		},
		this.follow = {
			'on' : false,
			'acc': []
		}
		this.info = {
			'threads': 1,
			'headless': true,
			'nbr_acc': 0
		}
	}
	handler_tag(nbr) {
		this.tag.on = true,
		this.tag.nbr = nbr
	}
	handler_follow(acc) {
		this.follow.on = true,
		this.follow.acc = acc
	}
}

class	rand {
	gen_month() {
		return (chance.integer({min: 1, max: 12}))
	}
	gen_day() {
		return (chance.integer({min: 1, max: 28}))
	}
	gen_year() {
		return (chance.integer({min: 1985, max: 2003}))
	}
	gen_name() {
		return (chance.name({nationality: 'en'}))
	}
	gen_number(min, max) {
		return (chance.integer({min: min, max: max}))
	}
}

	//////CREATE CLASS VARIABLE//////

//var proxies = create_proxy_array()
//var action = new actions
const random = new rand
const twit = new follow(require('./tokens/twitter.json')['Bearer'])

	//////MODIFICATION ON CLASS VARIABLE//////

// acc[0].write_file(acc)
// //action.url = "https://twitter.com/ignxred/status/1510728821003198466"
// action.rt = true
// action.like = true
// action.info.headless = true
// action.info.threads = 15
// //action.info.nbr_acc = 30
// action.handler_follow([`wungay`])
// action.handler_tag(2)

/*
	HANDLER
*/

async function main_handler(acc, action) {
	var i = 0
	var prom = []
	var size = await acc[0].populate('info')
	console.log(size)
	const pool = new StaticPool({
		size: action.info.threads,
		task: process.cwd() + "/srcs/main_worker.js"
	});
	if (acc.length == 0)
		return (1)
	while (i < action.info.nbr_acc) {
		prom.push(pool.exec({action: action, account: acc[i], array: acc, index: i}))
		i++;
	}
	await Promise.all(prom)
	return (0)
}

async function init_handler(action) {
	var i = 0;
	var prom = []
	const pool = new StaticPool({
		size: action.info.threads,
		task: "./srcs/init_acc.js"
	});

	while (i < acc[0].size) {
		if (acc[i].tag == "" || fs.existsSync(__dirname + `/cookies/${acc[i].user}_cookies.json`) == false || acc[i].init == true) {
			if (acc[i].proxy == "") {
				acc[i].proxy = give_proxy()
			}
			prom.push(pool.exec({account: acc[i], index: i}))
		}
		i++;
	}
	acc[0].write_file(acc);
	await Promise.all(prom)
	return (0)
}

async function check_pva(acc) {
	var i = 0
	var prom = []
	const pool = new StaticPool({
		size: 15, //action.info.threads,
		task: "./srcs/check_for_pva.js"
	});

	if (arr.length == 0)
		arr = acc
	while (i < arr[0].size) {
		prom.push(pool.exec({action: action, account: arr[i], index: i}))
		i++;
	}
	await Promise.all(prom)
}

/*
	MAIN
*/

async function main(arr, action) {
	//var acc = create_acc_array(arr)
	console.log(arr)
	if (action.info.pva) {
		console.log("Check for PVA")
		await check_pva(arr)
	}
	if (action.info.init) {
		console.log("Check for INIT")
		await init_handler(action)
	}
	console.log("Starting the actions")
	await main_handler(arr, action)
	commonEmitter.emit("finish")
	return (0)

}

/*
	UTILS
*/

	//////INIT UTILS//////

function create_acc_array(db) {
	let re = new Array

	for (let i in db) {
		re.push(new accounts(db[i].user, db[i].pass, db[i].tag, db[i].mail, db[i].proxy, "", db[i].cookies.cookies))
	}
	console.log(re[0])
	return (re);
}

function create_proxy_array() {
	let proxy = fs.readFileSync(__dirname + "/db/proxy.txt", 'utf8')
	let re = new Array

	proxy = proxy.split('\n')
	for (let x in proxy) {
		proxy[x] = proxy[x].trim()
		if (proxy[x])
			re.push(new proxy_stat(proxy[x], proxy.length))
	}
	return (re);
}

function give_proxy() {
	var tmp = proxies[random.gen_number(0, (proxies[0].size - 1))]
	return (tmp.proxy)
}

	//////MISC//////

function rm_useless_cookies() {
	var files = fs.readdirSync(__dirname + `/cookies/`)
	var db = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))

	for (let x in files) {
		let tmp = files[x].split('_cookies.json')[0]
		var i = 0
		var exist = false
		while (db[i]) {
			if (tmp == db[i].user)
				exist = true
			i++;
		}
		if (exist == false)
			fs.unlinkSync(__dirname + `/cookies/${tmp}_cookies.json`)
	}
}

async function rm_suspended() {
	var db_new = []
	let db = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))

	for (let i in db) {
		if (db[i].tag != "SUSPENDED") {
			db_new.push(db[i])
		}
	}
	for (let x in db_new)
		db_new[x].size = db_new.length
	acc[0].write_file(db_new)
	rm_useless_cookies()
}

async function rm_timeout(arr) {
	var db = JSON.parse(fs.readFileSync(process.cwd() + `/db/acc.json`, 'utf8'))

	for (let x in arr) {
		for (let i in db) {
			if (arr[x].tag == db[i].tag) {
				if (db[i].timeout == true)
					arr.splice(x, 1)
			}
		}
	}
	for (let x in arr) {
		arr[x].size = arr.length
	}
}

function already_in(db, acc) {
	var mail = acc.split(':')[0]
	for (let i in db) {
		if (db[i].user == mail)
			return (i);
	}
	return (-1);
}

/*
	TEST
*/

module.exports = {main}
