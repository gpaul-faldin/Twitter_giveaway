const twit = require('./twitter_class.js')
const cookies = require("./mongo/cookies.js")
const user = require("./mongo/User.js")
const {tweet} = require("./wrapper/twitter_wrapper.js")


async function retrieve_user_id() {
	const twi = new tweet(process.env.TWITTER)
	const arr = await user.find({old: false, ini_follow: true})
	for (let i = 0; i < await arr.length; i+= 15) {
		const chunk = arr.slice(i, i + 20)
		let prom = []
		for (let x in chunk) {
			prom.push(
				twi.get_id_name(chunk[x].tag.substring(1))
				.then((res) => {
					user.updateOne({tag: chunk[x].tag}, {$set: {user_id: res}})
				})
			)
		}
		await Promise.all(prom)
	}
}

async function follow_init() {
	await retrieve_user_id()
	const arr = await user.find({old: false, ini_follow: true})

	for (let i = 0; i < arr.length; i++) {
		const rand = Math.floor(Math.random() * (30 - 10) + 10)
		const chunk = arr.slice(i, rand);
		i += rand
		const prom = []
		for (let x in chunk)
			prom.push(follow_between(chunk, chunk[x]))
		await Promise.all(prom)
	}
}

async function follow_between (arr, account) {
	account.cookies = await cookies.findOne({ user: account.user })
	var twitter = new twit(account.cookies.req_cookie, account.cookies.crsf, account.proxy.split(':'), "0")
	var prom = []
	for (let x = 0; x < arr.length; x++) {
		if (arr[x] != account.user_id)
			prom.push(twitter.follow(arr[x]))
	}
	await Promise.all(prom)
	await user.updateOne({ user: account.user },
		{
			$set: {
				ini_follow: false,
			}
		})
	return (0)
}

module.exports = follow_init