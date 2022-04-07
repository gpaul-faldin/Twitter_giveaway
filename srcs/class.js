const user = require('./../mongo/User.js')

class	actions {
	constructor(MAX_THREAD) {
		this.url = "",
		this.rt = false,
		this.like = false,
		this.tag = {
			on : false,
			nbr : 0
		},
		this.follow = {
			on : false,
			acc: []
		}
		this.info = {
			threads: 1,
			headless: true,
			nbr_acc: 0,
			pva: false,
			init: false,
			max_threads: MAX_THREAD,
			ready: false
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
					this[act[x]].acc = query.follow.split(',')
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
			this.url = query.url
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
		return(await user.find({}, {"_id": 1}).limit(nbr))
	}
	async id_array_to_acc(arr) {
		var re = []

		for (let x in arr)
			re.push(await user.findById(arr[x]._id))//.populate('cookies'))
		return (re)
	}
	async id_to_X(x, arr) {
		var re = []
		var split = x.split(',')
		var selec = {}

		for (let i in split)
			selec[split[i]] = 1
		for (let n in arr)
			re.push(await user.findById(arr[n]._id, selec))
		return re
	}
	async get_size() {
		return (await user.countDocuments())
	}
	async lowest(nbr, opt) {
		var i = 0
		var save = []
		var re = []
		var arr = await this.get_acc_id(0).then(async(arr) => this.id_to_X(`info.${opt}.nbr`, arr))

		while (i < nbr) {
			var n = 0
			var lowest = 100
			for (let x in arr) {
				if (arr[x].info[opt].nbr < lowest && save.includes(x) == false) {
					n = x
					lowest = arr[x].info[opt].nbr
				}
			}
			save.push(n)
			re.push(arr[n])
			i++;
		}
		return re
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
}

module.exports = {actions, acc_manip}