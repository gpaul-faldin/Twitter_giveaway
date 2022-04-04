const { TwitterApi } = require('twitter-api-v2');

class twitter {
	constructor(token) {
		this.client = new TwitterApi(token)
	}
	add_info(re, user, id, metrics) {
		re[`${user}`] = {
			id: id,
			followers: {
				nbr: metrics.followers_count,
				arr: []
				},
			following: metrics.following_count
		}
		return (re)
	}
	splitArray(arr, len) {
		var chunks = [], i = 0, n = arr.length;
		while (i < n) {
			chunks.push(arr.slice(i, i += len));
		}
		return chunks;
	}
}

class follow extends twitter {
	constructor(token) {
		super(token)
	}
	async users_follow_API(users, re) {
		var web = await this.client.v2.usersByUsernames(users, { "user.fields": "public_metrics" })
		for (let x in web.data) {
			re = this.add_info(re, web.data[x].username, web.data[x].id, web.data[x].public_metrics)
		}
		return (re)
	}
	async re_users_follow(users) {
		var re = {}
		var chunks = this.splitArray(users, 100)
		for (let index in chunks) {
			re = await this.users_follow_API(chunks[index], re)
		}
		return (re)
	}
	async get_followers(id) {
		var re = []
		try {
			var web = await this.client.v2.followers(id)
			for (let x in web.data) {
				re.push("@" + web.data[x].username)
			}
		}
		catch (e) {}
		return (re)
	}
}

class search extends twitter {
	constructor(token, query) {
		super(token)
		this.query = query
	}
	async user_search(topic_db) {
		for (let i = 0; i < 52; i++) {
			var web = await this.client.v1.searchUsers(this.query, { page: i })
			for (let x in web.users) {
				if (web.users[x].followers_count > 10000) {
					topic_db[`${web.users[x].screen_name}`] = web.users[x].followers_count
				}
			}
		}
	}

}

// (async() => {

// 	var tmp = new search(require('../tokens/twitter.json')['Bearer'])
// 	console.log(await tmp.get_followers('1506909517099200515'))

// })();


module.exports = {follow, search}