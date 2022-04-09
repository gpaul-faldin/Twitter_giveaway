/*
	REQUIRE
*/
var common = require('../srcs/events/common');
const { actions, acc_manip, info_manip} = require('./../srcs/class')
const {follow} = require('../srcs/twitter_wrapper.js')
const {main} = require('../srcs/main.js')
require("dotenv").config();


/*
	EVENTS
*/
var IN_USE = false

var commonEmitter = common.commonEmitter;
commonEmitter.on("finish", data => {
	console.log("Action finished")
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
		} catch (e) {
			return (res.status(400).send(e.message))

		}
		action.info.ready = true
		res.send(`Action is ready`)
	}
	else {
		res.status(503).send(`Service already in use`)
	}
}

/*
	START
*/

const start_handler = async function (req, res) {
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

/*
	PUSH/UPDATE
*/

const update_twitter_handler = async function (req, res) {
	if (!req.query.opt)
		return (res.status(400).send("Opt param is obligatory"))
	if (req.query.opt !== "1" && req.query.opt !== '2')
		return (res.status(400).send("Opt must be :\n 1 == follower/following count\n 2 == follower array"))
	res.send("Update on the way")
	var twitter = new follow(process.env.TWITTER)
	var manip = new acc_manip
	var manip_i = new info_manip
	if (req.query.opt === "1") {
		var lst = await manip.get_acc_id(0).then(async (re) => await manip.name_id_to_X("tag", re)).then((arr) => manip.make_list(arr))
		var nbrs = await twitter.get_nbr_follow(lst.split(','))
		return (await manip_i.update_info_array(nbrs))
	}
	let tmp = await manip_i.info_arr(15, "empty").then(async (infos) => await twitter.get_followers_arr(infos))
	return (await manip_i.update_info_array(tmp))
}

/*
	EXPORT
*/

module.exports = {
	check_auth,
	action_handler,
	start_handler,
	retrieve_lowest_handler,
	retrieve_random_handler,
	retrieve_spe_handler,
	update_twitter_handler
}