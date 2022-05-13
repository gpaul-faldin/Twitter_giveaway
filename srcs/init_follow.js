const twit = require('./twitter_class.js')
const cookies = require("./mongo/cookies.js")
const user = require("./mongo/User.js")
const {tweet} = require("./wrapper/twitter_wrapper.js")


async function retrieve_user_id() {
	const twi = new tweet(process.env.TWITTER)
	const arr = await user.find({ old: { $ne: true }, ini_follow: true, user_id: { $eq: null } })
	for (let i = 0; i < arr.length; i+= 15) {
		const chunk = arr.slice(i, i + 20)
		for (let x in chunk) {
			let res = await twi.get_id_name(chunk[x].tag.substring(1))
			console.log(res)
			await user.updateOne({tag: chunk[x].tag}, {$set: {user_id: res}})
		}
	}
}

async function follow_init() {
	await retrieve_user_id()
	const arr = await user.find({old: { $ne: true }, ini_follow: true, ini: false})

	for (let i = 0; i < arr.length; i++) {
		const rand = Math.floor(Math.random() * (30 - 10) + 10)
		console.log(i, rand)
		if (i + rand > arr.length)
			var chunk = arr.slice(i, arr.length)
		else
			var chunk = arr.slice(i, i + rand);
		i += rand
		const prom = []
		for (let x in chunk)
			prom.push(await follow_between(chunk, chunk[x]))
		await Promise.all(prom)
	}
}

async function follow_between (arr, account) {
	account.cookies = await cookies.findOne({ user: account.user })
	var twitter = new twit(account.cookies.req_cookie, account.cookies.crsf, account.proxy.split(':'), "0")
	for (let x = 0; x < arr.length; x++) {
		if (arr[x].user_id != account.user_id)
			await twitter.follow(arr[x].user_id)
	}
	await user.updateOne({ user: account.user },
		{
			$set: {
				ini_follow: false,
			}
		})
	return (0)
}

module.exports = follow_init