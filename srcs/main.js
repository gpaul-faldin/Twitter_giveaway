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
	constructor(user, pass, tag, mail, proxy, info, cookies, init, init_follow) {
		this.user = user
		this.pass = pass
		this.tag = tag
		this.mail = mail
		this.proxy = proxy
		this.timeout = false
		this.init = init
		this.init_follow = init_follow
		this.info = info
		this.cookies = cookies
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

async function init_worker(threads, arr) {
	var i = 0;
	var prom = []
	var acc = create_acc_array(arr)
	const pool = new StaticPool({
		size: 14,
		task: "./srcs/init_acc.js"
	});

	for (let x in acc)
		prom.push(pool.exec({account: acc[x], index: i}))
	await Promise.all(prom)
	commonEmitter.emit("finish")
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
		await check_pva(acc, action)
	}
	console.log("Starting the actions")
	await main_handler(acc, action)
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
		re.push(new accounts(db[i].user, db[i].pass, db[i].tag, db[i].mail, db[i].proxy, {}, [], db[i].ini, db[i].ini_follow))
	}
	return (re);
}

module.exports = {main, init_worker}
