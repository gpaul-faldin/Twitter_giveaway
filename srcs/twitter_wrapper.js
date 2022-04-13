const { TwitterApi } = require('twitter-api-v2');
const path = require('path');
const axios = require('axios').default
const fs = require('fs')

class twitter {
	constructor(token) {
		this.client = new TwitterApi(token)
	}
	add_info_nbr(re, user, id, metrics) {
		re[user] = {
			id: id,
			followers: {
				nbr: metrics.followers_count,
				arr: []
				},
			following: {
				nbr: metrics.following_count,
				arr: []
			}
		}
		return (re)
	}
	add_info_arr(re, user, id, follower_nbr, follower, following_nbr) {
		re[user] = {
			id: id,
			followers: {
				nbr: follower_nbr,
				arr: follower
				},
			following: {
				nbr: following_nbr,
				arr: []
			}
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
	async nbr_follow_API(users, re) {
		var web = await this.client.v2.usersByUsernames(users, { "user.fields": "public_metrics" })
		for (let x in web.data) {
			re = this.add_info_nbr(re, web.data[x].username, web.data[x].id, web.data[x].public_metrics)
		}
		return (re)
	}
	async get_nbr_follow(users) {
		var re = {}
		for (let x in users) {
			if (users[x][0] === '@')
				users[x] = users[x].substring(1)
		}
		var chunks = this.splitArray(users, 100)
		for (let index in chunks) {
			re = await this.nbr_follow_API(chunks[index], re)
		}
		return (re)
	}
	async get_followers_list_API(nfo, re) {
		var arr = []
		try {
			var web = await this.client.v2.followers(nfo.info.id)
			for (let x in web.data) {
				arr.push("@" + web.data[x].username)
			}
		}
		catch (e) {
			console.log(e.message, e.rateLimit)
		}
		re = this.add_info_arr(re, nfo.user, nfo.info.id, nfo.info.followers.nbr, arr, nfo.info.following.nbr)
		return (re)
	}
	async get_followers_arr(infos) {
		var re = {}
		for (let x in infos) {
			re = await this.get_followers_list_API(infos[x], re)
		}
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
	async scrape_profileP(id) {
		var re = []
		var web = await this.client.v2.followers(id, {"user.fields": "profile_image_url", max_results: 1000})
		//var prom = []
		web = web.data
		for (let x in web) {
			if (web[x].profile_image_url !== 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png') {
				let tmp = web[x].profile_image_url.split('_normal')[0]
				re.push(tmp + '.jpg')
			}
		}
		console.log(web)
		for (let i in re) {
			let name = 'n-' + re[i].substring(37)
			name = name.replaceAll('/', '_')
			if (fs.existsSync(`./banner-pp/db/pp/${name}`) == false) {
				try {await this.download_pic(re[i], './banner-pp/db/pp', name)}
				catch(e) {
					console.log(re[i])
				}

			}
		}
		//await Promise.all(prom)
		
		//console.log('https://pbs.twimg.com/profile_images/1511441890016702465/Z2LYR5SB.jpg'.substring(37))
	}
	async download_pic(fileUrl, downloadFolder, name) {
		const localFilePath = path.resolve(__dirname, downloadFolder, name);

		try {
			const response = await axios({
				method: 'GET',
				url: fileUrl,
				responseType: 'stream',
			});
		response.data.pipe(fs.createWriteStream(localFilePath));
		} catch (err) {
			throw new Error(err);
		}
	}
	async id_from_user(string) {
		var re = []
		string = string.replaceAll('@', '')
		var web = await this.client.v2.usersByUsernames(string)
		for (let x in web.data) {
			re.push(web.data[x].id)
		}
		return (re)
	}
}

module.exports = {follow, search}