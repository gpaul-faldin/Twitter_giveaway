/*
	REQUIRE
*/
var common = require('../srcs/events/common');
const {actions, acc_manip, info_manip} = require('./../srcs/class')
const {follow, tweet} = require('../srcs/wrapper/twitter_wrapper.js')
const {main, init_worker} = require('../srcs/main.js')
const User = require('./../srcs/mongo/User.js')
const proxies = require('./../srcs/mongo/proxies.js')
const twitter_info = require('./../srcs/mongo/twitter_info.js')
const cookies = require('./../srcs/mongo/cookies.js');
require("dotenv").config();
const {Webhook} = require('simple-discord-webhooks');
const ga = require('./../srcs/mongo/giveaway.js');
const cron_ga = require('../srcs/cron/cron_class_ga.js')
const {setup_ga} = require('../srcs/setup_ga.js')

const webhook = new Webhook(process.env.HOOK)

/*
	EVENTS
*/
var IN_USE = false

var commonEmitter = common.commonEmitter;
commonEmitter.on("finish", data => {
	IN_USE == true ? IN_USE = false : 0
});

/*
	INIT
*/
var MAX_THREAD = 15
var action = new actions(MAX_THREAD)

/*
	TOKEN CHECK
*/

const check_auth = function (req, res, next) {
	if (!req.headers.authorization)
		return (res.status(400).send("Token is missing"))
	if (req.headers.authorization.split('Bearer ')[1] === process.env.ADM_TOKEN)
		return (next())
	return (res.status(401).send("Bad Token"))
}

/*
	ACTION
*/

const action_handler = async function (req, res) {
	if (IN_USE == false) {
		try {
			await action.parse_query(req.query, req.body)
			var twit = new tweet(process.env.TWITTER)
			await twit.fill_giveaway(action, req.query.end, req.query.url)
			if (!req.query.opt) {
				new cron_ga(action.id, action.info.interval, action)
				action = new actions(MAX_THREAD)
			}
		} catch (e) {
			return (res.status(400).send(e.message))
		}
		res.send(`Action is ready`)
	}
	else {
		res.status(503).send(`Service already in use`)
	}
}

const action_handler2 = async function (req, res) {
	if (!req.query.url)
		return (res.status(400).send("The url query is missing"))
	if (!req.query.end)
		return (res.status(400).send("The end query is missing"))
	if (!req.query.nbr_acc)
		req.query.nbr_acc = 0
	var id = req.query.url.split("status/")[1]
	if (id == undefined)
		return (res.status(400).send("Not a valid URL"))
	var test = false
	if (req.query.test)
		test = true
	res.send("Giveaway added to the database")
	await setup_ga(req.query.url, req.query.end, req.query.nbr_acc, id, test)
}

const start_handler = async function (req, res) {
	var body = req.body
	var manip = new acc_manip
	var arr = []

	if (IN_USE == false) {
		if (Object.keys(body).length === 0)
			return (res.status(400).send("No body found"))
		if (!body.mode)
			return (res.status(400).send("Missing mode field in body"))
		if (!body.action) {
			if (!req.query.id)
				return (res.status(400).send("Query id not found"))
			body.action = await ga.findOne({tweet_id: req.query.id}, {action: 1}).then((x) => {
				return (x.action)
			})
		}
		switch (body.mode) {
			case 'rand':
				arr = await manip.getRandom(action.info.nbr_acc).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			case 'lowest':
				if (body.opt != "1" && body.opt != "2")
					return res.status(400).send(`opt must be 1 (following) or 2 (followers) for mode lowest`)
				body.opt == 1 ? body.opt = "following" : body.opt = "followers"
				arr = await manip.lowest(action.info.nbr_acc, body.opt).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			case 'spe':
				arr = await manip.get_spe(body.opt).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			case 'classic':
				arr = await manip.get_acc_id(action.info.nbr_acc).then(async (arr) => await manip.id_array_to_acc(arr))
				break;
			default :
				return (res.status(400).send(`${body.mode} is not a valid option`))
		}
		if (arr.length != 0) {
			//IN_USE = true
			main(arr, body.action)
			return (res.send("OK"))
		}
		return (res.status(400).send("Error: The account list was empty"))
	}
	return (res.status(503).send('Bot already in use'))
}

const init_handler = async function (req, res) {

	if (IN_USE == false) {
		if (req.query.opt) {
			var lst = req.query.opt.split(",")
			await User.updateMany({user: {$in: lst}}, {$set : {ini: true}})
			var arr = await User.find({user: {$in: lst}})
		}
		else
			var arr = await User.find({ ini: true })
		IN_USE = true
		res.send(`${arr.length} accounts are being initialized`)
		init_worker(MAX_THREAD, arr)
		return (0)
	}
	return (res.status(503).send('Bot already in use'))
}

/*
	RETRIEVE
*/

const retrieve_lowest_handler = async function (req, res) {
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
	if (req.query.output) {
		let re = (await manip.lowest(qty, opt).then(async (arr) => await manip.name_id_to_X(req.query.output, arr)))
		if (req.query.list)
			return (res.send(manip.make_list(re)))
		return (res.send(re))
	}
	return res.send(await manip.lowest(qty, opt).then(async (arr) => await manip.id_array_to_acc(arr)))
}

const retrieve_random_handler = async function (req, res) {
	var manip = new acc_manip
	var qty = await manip.get_size()
	if (req.query.qty) {
		if (!Number(req.query.qty))
			return res.status(400).send(`qty type must be Number`)
		qty = req.query.qty
	}
	if (!req.query.output)
		return res.send(await manip.getRandom(qty).then(async (arr) => await manip.id_array_to_acc(arr)))
	return (res.send(await manip.getRandom(qty).then(async (arr) => await manip.name_id_to_X(req.query.output, arr))))
}

const retrieve_spe_handler = async function (req, res) {
	var manip = new acc_manip
	if (!req.query.tag)
		return (res.status(400).send(`tag(s) must be specified`))
	var re = await manip.get_spe(req.query.tag)
	if (!req.query.output)
		return (res.send(await manip.id_array_to_acc(re)))
	return (res.send(await manip.name_id_to_X(req.query.output, re)))
}

const retrieve_number = async function (req, res) {
	if (!req.query.opt)
		return (res.status(400).send(`Need to provide opt query:\n1 == Active\n2 == timed out`))
	if (req.query.opt == 1)
		return (res.send(`Number of active accounts: ${await User.countDocuments({ timeout: false })}`))
	if (req.query.opt == 2)
		return (res.send(`Number of timed out accounts : ${await User.countDocuments({ timeout: true })}`))
	return (res.status(400).send(`Opt must be 1 or 2`))
}

/*
	PUSH/UPDATE
*/

const update_twitter_handler = async function (req, res) {
	if (!req.query.opt)
		return (res.status(400).send("Opt param is obligatory"))
	if (req.query.opt > "3" || req.query.opt < "1")
		return (res.status(400).send("Opt must be :\n1 == follower/following count\n2 == follower array\n3 == all"))
	res.send("Update on the way")
	var twitter = new follow(process.env.TWITTER)
	var manip = new acc_manip
	var manip_i = new info_manip
	
	if (req.query.opt === "1" || req.query.opt === "3") {
		var lst = await manip.get_acc_id(0).then(async (re) => await manip.name_id_to_X("tag", re)).then((arr) => manip.make_list(arr))
		
		var nbrs = await twitter.get_nbr_follow(lst.split(','))
		await manip_i.update_info_array(nbrs)
		if (req.query.opt === "3")
			await sleep(5000)
	}
	if (req.query.opt === "3" || req.query.opt === "2") {
		let tmp = await manip_i.info_arr(15, "empty").then(async (infos) => await twitter.get_followers_arr(infos))
		await manip_i.update_info_array(tmp)
	}
	return ;
}

const add_proxy = async function (req, res) {
	if (req.body.length === undefined)
		return (res.status(400).send("Body is required to perform actions"))
	var body = req.body.split('\r\n')
	res.send("Proxies are being added to the db")
	for (let x in body) {
		if (await proxies.find({ proxy: { $eq: body[x] } }).count() === 0)
			await proxies.create({ proxy: body[x] })
	}
	return (0)
}

const add_account = async function (req, res) {
	if (req.body.length === undefined)
		return (res.status(400).send("Body is required to perform actions"))
	var body = req.body.split('\n\r\n')
	res.send("Adding accounts to the database")
	for (let x in body) {
		let tmp = body[x].split('\r\n')
		let login = tmp[0].split(": ")[1]
		if (await User.findOne({ user: login }).count() == 0) {
			if (await twitter_info.findOne({ user: login }).count() == 0)
				await twitter_info.create({
					user: login,
					info: {
						id: "",
						followers: {
							nbr: 0,
							arr: []
						},
						following: {
							nbr: 0,
							arr: []
						}
					}
				})
			await User.create({
				user: login,
				pass: tmp[1].split(": ")[1],
				mail: tmp[2].split(": ")[1],
				tag: "",
				proxy: await proxies.aggregate([{ $sample: { size: 1 } }]).then((re) => re[0].proxy),
				timeout: false,
				ini: true,
				ini_follow: true,
				info: await twitter_info.findOne({ user: login })
			})
		}
		await twitter_info.updateOne({ user: login }, {$set: {referTo: await User.findOne({ user: login })}})
	}
	return (0);
}

const update_proxy = async function (req, res) {
	if (!req.query.opt)
		return (res.status(400).send("opt query is necessary"))
	switch (req.query.opt) {
		case "tag":
			if (!req.query.tag)
				return (res.status(400).send("tag query is necessary when using tag opt"))
			res.send("Proxies are being changed")
			let split = req.query.tag.split(',')
			for (let x in split) {
				split[x] = split[x][0] == '@' ? split[x] : "@" + split[x]
				await User.updateMany({ tag: split[x] }, { $set: { proxy: await proxies.aggregate([{ $sample: { size: 1 } }]).then((re) => re[0].proxy) } })
			}
			break;
		case "all":
			res.send("Proxies are being changed")
			let acc = await User.find()
			for (let x in acc) {
				await User.updateMany(acc[x], { $set: { proxy: await proxies.aggregate([{ $sample: { size: 1 } }]).then((re) => re[0].proxy) } })
			}
			break;
		case "empty":
			res.send("Proxies are being changed")
			var lst = await User.find({ proxy: "" })
			for (let x in lst)
				await User.updateMany(lst[x], { $set: { proxy: await proxies.aggregate([{ $sample: { size: 1 } }]).then((re) => re[0].proxy) } })
			break;
		default:
			return (res.status(400).send(`${req.query.opt} is not a valid option, valid options are:\n-tag\n-all\n-empty`))
	}
	return (0);
}

/*
	DELETE
*/

const proxy_delete = async function (req, res) {
	if (req.body.length === undefined)
		return (res.status(400).send("Body is required to perform actions"))
	var body = req.body.split('\r\n')
	res.send("proxies are being removed from account(s)")
	for (let x in body) {
		if (await proxies.find({ proxy: { $eq: body[x] } }).count() === 1) {
			await proxies.deleteOne({ proxy: { $eq: body[x] } })
			if (!req.query.opt) {
				let new_prox = await proxies.aggregate([{ $sample: { size: 1 } }]).then((re) => re[0].proxy)
				await user.updateOne({ proxy: body[x] }, { $set: { proxy: new_prox } })
			}
			else
				await user.updateOne({ proxy: body[x] }, { $set: { proxy: '' } })
		}
	}
	return;
}

const account_delete = async function (req, res) {
	if (!req.query.user)
		return (res.status(400).send("Missing the user query"))
	res.send("If the Accounts exists they are being deleted")
	var lst = req.query.user.split(',')
	for (let x in lst) {
		if (await cookies.find({user: lst[x]}))
			await cookies.deleteOne({ user: { $eq: lst[x] } })
		await User.deleteOne({ user: { $eq: lst[x] } })
		await twitter_info.deleteOne({ user: { $eq: lst[x] } })
	}
	return (0);
}

/*
	UTILS
*/
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/*
	START
*/

// (async () =>{
// 	var lst = await ga.find({participate: false})
// 	for (let x in lst){
// 		new cron_ga(lst[x].tweet_id, lst[x].info.interval, lst[x].action)
// 	}
// })()

/*
	EXPORT
*/

module.exports = {
	check_auth,
	action_handler,
	action_handler2,
	start_handler,
	init_handler,
	retrieve_lowest_handler,
	retrieve_random_handler,
	retrieve_spe_handler,
	retrieve_number,
	update_twitter_handler,
	update_proxy,
	add_proxy,
	add_account,
	proxy_delete,
	account_delete
}