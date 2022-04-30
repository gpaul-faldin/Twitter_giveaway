/*
	REQUIRE
*/
const {StaticPool} = require("node-worker-threads-pool");
var common = require('./events/common');
var commonEmitter = common.commonEmitter;
var Chance = require('chance')
var ga = require('./mongo/giveaway.js')
const twit = require('./twitter_class')
const {Webhook} = require('simple-discord-webhooks');

const webhook = new Webhook(`https://discord.com/api/webhooks/966783471911571486/i7xTtaMRUR3ErvhQDIlXiz5ZEOoBCmnJwh6q3yPkg37kQ1IJ9PXXWNqRVjwT2Um6wC4Y`)

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

async function req_main(action, user) {

	await Promise.all([
		user.populate('cookies'),
		user.populate('info')
	])
	var twitter = new twit(user.cookies.req_cookie, user.cookies.crsf, user.proxy.split(':'), action.id)
	var prom = []

	if (action.like == true) {
		prom.push(twitter.like())
	}
	if (action.rt == true) {
		prom.push(twitter.rt())
	}
	if (action.ytb == true) {
		prom.push(twitter.tweet_pic(user.user))
	}
	if (action.tag.on == true) {
		prom.push(twitter.tag(get_random_at(user, action.tag.nbr)))
	}
	if (action.follow.on == true) {
		for (let x in action.follow.acc) {
			prom.push(twitter.follow(action.follow.acc[x]))
		}
	}
	var res_prom = await Promise.all(prom).then(async(value) => {
		for (let x in value) {
			if (value[x] == false) {
				await ga.updateOne({tweet_id: action.id}, {$inc: {'info.nbr_acc': -1}})
				webhook.send(`${user.user} might be timeout ${value} for ${action.id}`)
				break;
			}
		}
		return (value)
	})
	await ga.updateOne({tweet_id: action.id}, {$inc: {'info.nbr_parti': 1}, $push: {"info.acc": user.user}})
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

async function check_pva(arr, action) {
	var prom = []
	var acc = create_acc_array(arr)
	const pool = new StaticPool({
		size: action.info.max_threads,
		task: "./srcs/check_for_pva.js"
	});

	if (acc.length == 0)
		return (1)
	for (let i in acc)
		prom.push(pool.exec({action: action, account: acc[i], index: i}))
	await Promise.all(prom)
}

/*
	MAIN
*/

async function main(arr, action) {


	// if (action.info.pva == true) {
	// 	console.log("Check for PVA")
	// 	await check_pva(arr, action)
	// }

	for (let x in arr) {
		await req_main(action, arr[x])
	}
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
