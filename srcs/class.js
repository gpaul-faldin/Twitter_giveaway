const user = require('./mongo/User.js')
const info = require('./mongo/twitter_info.js')
const proxies = require('./mongo/proxies.js')
const cookies = require('./mongo/cookies.js')
const {search} = require('./wrapper/twitter_wrapper')
require("dotenv").config();


class	actions {
	constructor(MAX_THREAD) {
		this.id = "",
		this.rt = true,
		this.like = true,
		this.tag = {
			on : false,
			nbr : 0
		},
		this.follow = {
			on : false,
			acc: []
		}
		this.ytb = false,
		this.info = {
			headless: true,
			nbr_acc: 0,
			pva: false,
			max_threads: MAX_THREAD,
			ready: false,
			interval: 0
		}
	}
	async parse_query(query, body) {
		if (!query.action)
			throw Error ('Missing action query')
		let act = query.action.split(',')
		for (let x in act) {
			if (this[act[x]] != undefined) {
				if (act[x] === 'follow') {
					this[act[x]].on = true
					if (!query.follow)
						throw Error ('Missing follow query')
					let tmp = new search(process.env.TWITTER, "")
					this[act[x]].acc = await tmp.id_from_user(query.follow)
				}
				else if (act[x] === 'tag') {
					this[act[x]].on = true
					if (!query.tag > 0)
						throw Error ('tag <= 0')
					this[act[x]].nbr = query.tag
				}
				else
					this[act[x]] = true
			}
		}
		if (query.url)
			this.id = query.url.split('/')[5]
		if (query.option) {
			await this.parse_body(body)
		}
		return ("OK")
	}
	async parse_body(body) {
		for (let x in body) {
			if (this.info[x] != undefined) {
				if (x === 'threads') {
					if (body[x] <= 0)
						throw Error (`Threads value <= 0`)
					if (body[x] > this.info.max_threads)
						throw Error (`Threads value > ${this.info.max_threads}`)
					if (body[x] > 0 && body[x] <= this.info.max_threads)
						this.info[x] = body[x]
				}
				if (x === 'nbr_acc') {
					if (body[x] > await user.countDocuments()) {
						throw Error(`Requested ${body[x]} account where ${await user.countDocuments()} are available`)
					}
					if (body[x] == 0)
						this.info[x] = await user.countDocuments()
					else
						this.info[x] = body[x]
				}
				else {
					if (typeof(body[x]) != typeof(this.info[x]))
						throw Error (`Unsupported value for ${x}, ${x} take a ${typeof(this.info[x])}`)
					this.info[x] = body[x]
				}
			}
		}
		return ('OK')
	}
}

class info_manip {
	constructor() {
	}
	async update_info(nfo, name) {

		console.log(`NAME: ${name}\n NFO: ${nfo}`)

		if (nfo.followers.arr.length === 0)
			nfo.followers.arr = await user.findOne({user: name}).then(async(x) => await info.findOne({"user": x.user}, {"info.followers.arr": 1}).then((y) => y.info.followers.arr))
		await user.findOne({user: name}).then(async(x) =>await info.updateOne({"user": x.user}, {info: nfo}))
	}
	async update_info_array(nfo_arr) {
		for (let x in nfo_arr) {
			await this.update_info(nfo_arr[x], x)
		}
	}
	async info_arr(nbr, opt) {
		if (opt == "empty") {
			var db = await info.find({'info.followers.arr': {$eq: []}}).limit(nbr)
			return (db)
		}
	}
}

class acc_manip {
	constructor(){
	}
	async getRandom(nbr) {
		var arr = await user.find({}, {"_id": 1})
		var len = arr.length;

		if (nbr > len || nbr <= 0)
			nbr = len
		var result = new Array(nbr);
		var taken = new Array(len);
		while (nbr--) {
			var x = Math.floor(Math.random() * len);
			result[nbr] = arr[x in taken ? taken[x] : x];
			taken[x] = --len in taken ? taken[len] : len;
		}
		return result;
	}
	async get_acc_id(nbr) {
		if (nbr === 0)
			nbr = await this.get_size()
		return(await user.find({old: {$ne: false}}, {"_id": 1}).limit(nbr))
	}
	async get_info_id() {
		return(await info.find({}, {"_id": 1}))
	}
	async id_array_to_acc(arr) {
		var re = []

		for (let x in arr) {
			let acc = await user.findById(arr[x]._id)
			if (acc.timeout === false)
				re.push(acc)
		}
		return (re)
	}
	async name_id_to_X(x, arr) {
		var re = []
		var split = x.split(',')
		var selec = { _id: 0, timeout: 1 }

		for (let i in split)
			selec[split[i]] = 1
		for (let n in arr) {
			if (split.includes('info'))
				var acc = await user.findById(arr[n]._id, selec).populate('info')
			else
				var acc = await user.findById(arr[n]._id, selec)
			if (acc.timeout === false)
				re.push(acc)
		}
		return (re)
	}
	async info_id_to_X(x, arr) {
		var re = []
		var split = x.split(',')
		var selec = { _id: 0 }

		for (let i in split)
			selec[split[i]] = 1
		for (let n in arr) {
			if (split.includes('info'))
				re.push(await info.findById(arr[n]._id, selec).populate('info'))
			else
				re.push(await info.findById(arr[n]._id, selec))
		}
		return (re)
	}
	async get_size() {
		return (await user.countDocuments())
	}
	async lowest(nbr, opt) {
		var i = 0
		var re = []
		var arr = await this.get_info_id().then(async(arr) => await this.info_id_to_X(`info.${opt}.nbr,referTo`, arr))
		arr.sort()

		while (i < nbr) {
			re.push(arr[i].referTo)
			i++;
		}
		return (re)
	}
	async get_spe(tag) {
		var split = tag.split(',')
		var re = []

		for (let x in split) {
			let res = await user.findOne({tag: split[x]}, {"_id": 1})
			if (res != null)
				re.push(res)
		}
		return (re)
	}
	make_list(arr) {
		var re = ""

		for (let x in arr) {
			re += arr[x].tag + ","
		}
		re = re.slice(0, -1)
		return (re)
	}
}

module.exports = {actions, acc_manip, info_manip}