/*
	REQUIRE
*/
var chance = require('chance').Chance()
const {StaticPool} = require("node-worker-threads-pool");
const fs = require('fs');
const {twitter} = require('./srcs/twitter_wrapper.js')


/*
	INIT
*/

	//////CLASS//////

class	accounts {
	constructor(user, pass, tag, mail, proxy, size) {
		this.user = user
		this.pass = pass
		this.tag = tag
		this.mail = mail
		if (proxy)
			this.proxy = proxy
		else
			this.proxy = ""
		this.size = size
		this.info = {}
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
			re.push(acc[i].tag.substring(1))
		}
		return (re)
	}
	async update_info(acc) {
		var nfo = await twit.re_users_follow(this.username_arr(acc))
		for (let i in acc) {
			for (let x in nfo) {
				if (acc[i].tag.substring(1) == x) {
					acc[i].info = nfo[x]
					break ;
				}
			}
		}
		await this.write_file(acc)
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
var acc = create_acc_array()
var proxies = create_proxy_array()
var action = new actions
const random = new rand
const twit = new twitter(require('./tokens/twitter.json')['Bearer'])

	//////MODIFICATION ON CLASS VARIABLE//////

acc[0].write_file(acc)

action.url = ""
action.rt = true
action.like = true
action.info.headless = false
action.info.threads = 3
action.info.nbr_acc = 43
//action.handler_follow([`@wungay`])
action.handler_tag(1)

/*
	HANDLER
*/

async function main_handler(arr) {
	var i = 0
	var prom = []
	if (arr.length == -1)
		arr = acc
	const pool = new StaticPool({
		size: action.info.threads,
		task: "./srcs/main_worker.js"
	});
	while (i < arr[0].size) {
		prom.push(pool.exec({action: action, account: arr[i], array: arr, index: i}))
		i++;
	}
	await Promise.all(prom)
}

async function init_handler() {
	var i = 0;
	var prom = []
	const pool = new StaticPool({
		size: action.info.threads,
		task: "./srcs/new_acc.js"
	});

	while (i < acc[0].size) {
		if (acc[i].tag == "" || fs.existsSync(__dirname + `/cookies/${acc[i].user}_cookies.json`) == false) {
			if (acc[i].proxy == "") {
				acc[i].proxy = give_proxy()
			}
			prom.push(pool.exec({account: acc[i], index: i}))
		}
		i++;
	}
	acc[0].write_file(acc);
	await Promise.all(prom)
}

/*
	MAIN
*/

async function main(arr) {
	rm_useless_cookies()
	console.log("Check for init")
	await init_handler()
	console.log("Remove suspended accounts cookies nor info")
	await rm_suspended()
	console.log("Starting the actions")
	await main_handler(arr)
	await rm_suspended()
	process.exit()
}

(async () => {
	//await acc[0].update_info(acc)
	var arr = acc[0].lowest_followers(acc, action.info.nbr_acc)
	action.handler_follow(acc[0].username_arr(arr))
	//await main(acc[0].lowest_following(acc, action.info.nbr_acc))
	await acc[0].update_info(acc)
})();



/*
	UTILS
*/

	//////INIT UTILS//////

function create_acc_array() {
	let acc = fs.readFileSync(__dirname + "/db/accounts.txt", 'utf8')
	let db = JSON.parse(fs.readFileSync(__dirname + `/db/acc.json`, 'utf8'))
	let re = new Array
	var size = 0

	for (let i in db) {
		re.push(new accounts(db[i].user, db[i].pass, db[i].tag, db[i].mail, db[i].proxy, 0))
	}
	acc = acc.split('\n')
	for (let x in acc) {
		acc[x] = acc[x].trim()
		if (acc[x] && already_in(db, acc[x]) == -1) {
			let tmp = acc[x].split(':')
			re.push(new accounts(tmp[0], tmp[1], "", tmp[2], "", 0))
		}
	}
	for (let i in re)
		size = i
	size++
	for (let x in re) {
		re[x].size = size
	}
	return (re);
}

function create_proxy_array() {
	let proxy = fs.readFileSync(__dirname + "/db/proxy.txt", 'utf8')
	let re = new Array
	var size = 0

	proxy = proxy.split('\r')
	for (let x in proxy) {
		size = x
	}
	for (let x in proxy) {
		proxy[x] = proxy[x].trim()
		if (proxy[x])
			re.push(new proxy_stat(proxy[x], size))
	}
	return (re);
}

function give_proxy() {
	var tmp = proxies[random.gen_number(0, (proxies[0].size - 1))]

	while (tmp.state != 0 && tmp.max_use() != 0)
		tmp = proxies[random.gen_number(0, proxies[0].size)]
	tmp.status()
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
	var size = 0

	for (let x in db)
		size++

	for (let i in db) {
		if (db[i].tag != "SUSPENDED") {
			db[i].size = size
			db_new.push(db[i])
		}
	}
	acc[0].write_file(db_new)
	rm_useless_cookies()
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


