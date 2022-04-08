/*
	REQUIRE
*/
var chance = require('chance').Chance()
const {StaticPool} = require("node-worker-threads-pool");
const fs = require('fs');
const {follow} = require('./twitter_wrapper.js')
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
const random = new rand
const twit = new follow(require('../tokens/twitter.json')['Bearer'])

/*
	HANDLER
*/

async function main_handler(acc, action) {
	var i = 0
	var prom = []
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

async function check_pva(acc, action) {
	var i = 0
	var prom = []
	const pool = new StaticPool({
		size: action.info.threads,
		task: "./srcs/check_for_pva.js"
	});

	if (acc.length == 0)
		return (1)
	while (i < action.info.nbr_acc) {
		prom.push(pool.exec({action: action, account: acc[i], index: i}))
		i++;
	}
	await Promise.all(prom)
}

/*
	MAIN
*/

async function main(arr, action) {
	var acc = create_acc_array(arr)
	if (action.info.pva) {
		console.log("Check for PVA")
		await check_pva(acc)
	}
	if (action.info.init) {
		console.log("Check for INIT")
		await init_handler(action)
	}
	console.log("Starting the actions")
	await main_handler(acc, action)
	commonEmitter.emit("finish")
	console.log("FINISH")
	return (0)

}

/*
	UTILS
*/

	//////INIT UTILS//////

function create_acc_array(db) {
	let re = new Array

	for (let i in db) {
		re.push(new accounts(db[i].user, db[i].pass, db[i].tag, db[i].mail, db[i].proxy, {}, []))
	}
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

/*
	TEST
*/

module.exports = {main}
