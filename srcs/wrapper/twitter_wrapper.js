const { TwitterApi } = require('twitter-api-v2');
const path = require('path');
const axios = require('axios').default
const fs = require('fs')
const ga = require('../mongo/giveaway.js');
const sc = require('../mongo/screen_ga.js')
const User = require('../mongo/User.js');
const {Webhook} = require('simple-discord-webhooks');

const webhook = new Webhook(`https://discord.com/api/webhooks/963929665473482804/1j5BI8hClD-GolgKJdeVCV7_lpWPdcmaNIODqaV8OLhfrjWt8D9hIXfsmLQ539HxWeBS`)

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

class copy_profile extends twitter {
	constructor(token) {
		super(token)
		this.token = ""
	}
	async get_list_user(user_id) {
		if (this.token == "")
			try {
				var web = await this.client.v2.followers(user_id, {"user.fields": "profile_image_url,description,public_metrics", max_results: 1000})
				} catch (e) {return (null)}
		else
			try {
				var web = await this.client.v2.followers(user_id, {"user.fields": "profile_image_url,description,public_metrics", max_results: 1000, pagination_token: this.token})
				} catch (e) {return (null)}
		this.token = web.meta.next_token
		web = web.data
		var re = []
		for (let x = 0; x < web.length; x++) {
			if (web[x].profile_image_url.match(/default_profile_images|\.png/g) == null &&
				web[x].public_metrics.followers_count <= 500) {
					re.push(web[x])
			}
		}
		return (re)
	}
}

class tweet extends twitter {
	constructor(token) {
		super(token)
	}

	async get_id_name(name) {
		var web = await this.client.v2.usersByUsernames(name)
		return (web.data[0].id)
	}
	async get_date(id) {
		var re = await this.client.v2.singleTweet(id, {'tweet.fields': "created_at"})//.then((x) => x.data.created_at)
		if (re.errors)
			throw Error("The tweet does not exist")
		re = re.data.created_at
		return (Date.parse(re))
	}
	async fill_giveaway(action, end, url) {
		var start = await this.get_date(action.id)
		var interval = Math.trunc(((end - 1) * 24 * 60) / action.info.nbr_acc)
		action.info.interval = interval == 0 ? 1 : interval
		if (await ga.findOne({ tweet_id: action.id }) === null) {
			await ga.create({
				tweet_id: action.id,
				tweet_url: url,
				by: await this.get_id_name(url.split('/')[3]),
				start: start,
				draw: Date.now() + (end * 86400000),
				participate: false,
				info:{
					nbr_acc: action.info.nbr_acc,
					nbr_parti: 0,
					interval: interval == 0 ? 1 : interval
				},
				action: action
			})
			return (0)
		}
	}
	async check_win(giveaway) {
		var res = await this.client.v2.userTimeline(giveaway.by, { expansions: 'referenced_tweets.id', max_results: 20})
		let arr = res.data.data

		for (let x in arr) {
			if (arr[x].referenced_tweets) {
				if (arr[x].referenced_tweets[0].type === 'replied_to' || arr[x].referenced_tweets[0].type === 'quoted') {
					let ref_id = arr[x].referenced_tweets[0].id
					if (ref_id === giveaway.tweet_id) {
						console.log(arr[x].text, "GA check")
						if (arr[x].text.match(/win|congrat|gg\w+/gi)) {
							console.log(arr[x].text, "GA check 2")
							var tag = arr[x].text.match(/(@[A-Za-z1-9])\w+/g)[0]
							if (tag != null) {
								webhook.send(`Just checking to be sure check ${giveaway.tweet_url}`)
								if (await User.findOne({ tag: tag })) {
									webhook.send(`Winner Winner chicken dinner!\n${tag} just won this giveaway: ${giveaway.tweet_url}\n<@259353316184555521>`)
								}
								await sc.deleteMany({ tweet_id: giveaway.tweet_id })
								await ga.deleteOne({ tweet_id: giveaway.tweet_id })
							}
						}
					}
				}
			}
		}
	}
	async get_info_tweet(id) {
		var web = await this.client.v2.singleTweet(id, { "tweet.fields": "created_at,author_id"})
		return (web.data)
	}
	async get_sc(tweet_id) {
		var media = await this.client.v2.search(`conversation_id:${tweet_id}`, {'expansions': 'attachments.media_keys', 'media.fields': 'url'})
			.then((x) => {
				return(x.includes.media)
			})
		var prom = []
		for (let x in media) {
			let screenshot = await axios.get(media[x].url, {responseType: 'arraybuffer'})
			prom.push(sc.create({
				tweet_id: tweet_id,
				image_id: media[x].media_key,
				base64_img: Buffer.from(screenshot.data).toString('base64')
			}))
		}
		await Promise.all(prom)
	}
}

module.exports = {follow, search, tweet, copy_profile}