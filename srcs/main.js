/*
	REQUIRE
*/
const {StaticPool} = require("node-worker-threads-pool");
var common = require('./events/common');
var commonEmitter = common.commonEmitter;
var Chance = require('chance')
var ga = require('./mongo/giveaway.js')

/*
	INIT
*/

var chance = new Chance();

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

function create_acc_array(db) {
	let re = new Array

	for (let i in db) {
		re.push(new accounts(db[i].user, db[i].pass, db[i].tag, db[i].mail, db[i].proxy, {}, [], db[i].ini, db[i].ini_follow))
	}
	return (re);
}

/*
	HANDLER
*/

const twit = require('./twitter_class')

async function req_main(action, user) {
	await user.populate('cookies')
	await user.populate('info')
	var twitter = new twit(user.cookies.req_cookie, user.cookies.crsf, user.proxy.split(':'))
	var prom = []

	if (action.like == true) {
		prom.push(twitter.like(action.id))
	}
	if (action.rt == true) {
		prom.push(twitter.rt(action.id))
	}
	if (action.tag.on == true) {
		prom.push(twitter.tag(action.id, get_random_at(user, action.tag.nbr)))
	}
	if (action.follow.on == true) {
		for (let x in action.follow.acc) {
			prom.push(twitter.follow(action.follow.acc[x]))
		}
	}
	await Promise.all(prom).then((value) => {
		if (value.includes('NO'))
			return (1)
	})
	await ga.updateOne({tweet_id: action.id}, {$inc: {'info.nbr_acc': 1}, $push: {'info.acc': user.user}})
	return (0)
}

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
	//var acc = create_acc_array(arr)
	// if (action.info.pva) {
	// 	console.log("Check for PVA")
	// 	await check_pva(acc, action)
	// }
	// console.log("Starting the actions")
	// await main_handler(acc, action)

	for (let x in arr) {
		await req_main(action, arr[x])
	}
	await ga.updateOne({tweet_id: action.id}, {$set: {participate: true}})
	commonEmitter.emit("finish")
	return (0)

}


function get_random_at(user, nbr) {

	var re = "";
	var i = 0;
	var mem = [];

	var arr = user.info.info.followers.arr
	if (arr.length < nbr)
		return (re)
	while (i < nbr) {
		var tmp = chance.integer({ min: 0, max: (arr.length - 1) })
		if (mem.includes(arr[tmp]) == false) {
			re = re.length == 0 ? re.concat(arr[tmp]) : re.concat(" " + arr[tmp])
			mem.push(arr[tmp])
			i++
		}
	}
	return (re)
}

module.exports = {main, init_worker}
