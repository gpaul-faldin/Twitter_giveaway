/*
	REQUIRE
*/
var common = require('../srcs/events/common');
const { actions, acc_manip } = require('./../srcs/class')
const {main} = require('../srcs/main.js')


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
	ACTION
*/

const action_handler = async function action_fct(req, res) {
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

const start_handler = async function start(req, res) {
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

const retrieve_lowest_handler = async function lowest(req, res) {
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
	return res.send(await manip.lowest(qty, opt).then(async (arr) => await manip.name_id_to_X(req.query.output, arr)))
}

const retrieve_random_handler = async function random(req, res) {
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

const retrieve_spe_handler = async function specific(req, res) {
	var manip = new acc_manip
	if (!req.query.tag)
		return (res.status(400).send(`tag(s) must be specified`))
	var re = await manip.get_spe(req.query.tag)
	if (!req.query.output)
		return (res.send(await manip.id_array_to_acc(re)))
	return (res.send(await manip.name_id_to_X(req.query.output, re)))
}

module.exports = {action_handler, start_handler, retrieve_lowest_handler, retrieve_random_handler, retrieve_spe_handler}