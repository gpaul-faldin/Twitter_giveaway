const { TwitterApi } = require('twitter-api-v2');

class twitter {
	constructor(token) {
		this.client = new TwitterApi(token)
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
	add_info(re, user, id, metrics) {
		re[`${user}`] = {
			id: id,
			followers: metrics.followers_count,
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

module.exports = {twitter}