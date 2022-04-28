/*
	REQUIRE
*/

const axios = require('axios')
const sc = require('./mongo/screen_ga.js')
const FormData = require('form-data');

/*
	TWITTER ACTION CLASS
*/

class twit {
	constructor(cookies, csrf, proxy, tweet_id) {
		this.headers = {
			Authorization: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
			cookie: cookies,
			'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
			'content-type': "",
			'x-csrf-token': csrf,
			origin: "https://twitter.com",
			refer: "https://twitter.com/"
		}
		this.proxy = {
			host: proxy[0],
			prot: Number(proxy[1])
		}
		this.tweet_id = tweet_id
		this.img_id = "",
		this.size_img = 0,
		this.media_id = ""
		this.base64_img = ""
	}
	async like() {
		this.headers['content-type'] = "application/json"
		var ret = {}

		ret['like'] = false
		try {
			let re = await axios({
				method: 'post',
				url: 'https://twitter.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet',
				data: {
					"variables": {
						"tweet_id":this.tweet_id
					},
					"queryId": "lI07N6Otwv1PhnEgXILM7A"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			ret['like'] = true
			return (ret);
		} catch (e) {
			console.log(e)
			return (ret)
		}
	}
	async rt() {
		this.headers['content-type'] = "application/json"
		var ret = {}

		ret['rt'] = false
		try {
			let re = await axios({
				method: 'post',
				url: "https://twitter.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet",
				data: {
					"variables": {
						"tweet_id": this.tweet_id,
						"dark_request": false
					},
					"queryId": "lI07N6Otwv1PhnEgXILM7A"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			ret['rt'] = true
			return (ret)
		} catch (e) {
			console.log(e)
			return (ret)
		}
	}
	async tag(text) {
		this.headers['content-type'] = "application/json"
		var ret = {}

		ret['tag'] = false
		try {
			let re = await axios({
				method: 'post',
				url: "https://twitter.com/i/api/graphql/l-kS-W5Ht5bBGBNp-wNzcA/CreateTweet",
				data: {
					"variables": {
						"tweet_text": text,
						"reply": {
							"in_reply_to_tweet_id": this.tweet_id,
							"exclude_reply_user_ids": []
						},
						"media": {
							"media_entities": [],
							"possibly_sensitive": false
						},
						"withDownvotePerspective": false,
						"withReactionsMetadata": false,
						"withReactionsPerspective": false,
						"withSuperFollowsTweetFields": true,
						"withSuperFollowsUserFields": true,
						"semantic_annotation_ids": [],
						"dark_request": false,
						"__fs_dont_mention_me_view_api_enabled": true,
						"__fs_interactive_text_enabled": true,
						"__fs_responsive_web_uc_gql_enabled": false
					},
					"queryId": "6nmMmSYJiD9rc9SPKPJRcQ"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			ret['tag'] = true
			return (ret);
		} catch (e) {
			console.log(e)
			return (ret)
		}
	}
	async tweet_pic() {
		this.headers['content-type'] = "application/json"
		var ret = {}
		var img = await this.upload_media()

		ret['pic'] = false
		try {
			let re = await axios({
				method: 'post',
				url: "https://twitter.com/i/api/graphql/l-kS-W5Ht5bBGBNp-wNzcA/CreateTweet",
				data: {
					"variables": {
						"tweet_text": "",
						"reply": {
							"in_reply_to_tweet_id": this.tweet_id,
							"exclude_reply_user_ids": []
						},
						"media": {
							"media_entities": [{
								"media_id": img,
								"tagged_users": []
							}],
							"possibly_sensitive": false
						},
						"withDownvotePerspective": false,
						"withReactionsMetadata": false,
						"withReactionsPerspective": false,
						"withSuperFollowsTweetFields": true,
						"withSuperFollowsUserFields": true,
						"semantic_annotation_ids": [],
						"dark_request": false,
						"__fs_dont_mention_me_view_api_enabled": true,
						"__fs_interactive_text_enabled": true,
						"__fs_responsive_web_uc_gql_enabled": false
					},
					"queryId": "6nmMmSYJiD9rc9SPKPJRcQ"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			ret['pic'] = true
			return (ret);
		} catch (e) {
			console.log(e)
			return (ret)
		}
	}
	async follow(acc_id) {
		this.headers['content-type'] = 'application/x-www-form-urlencoded'
		var ret = {}
		ret['follow'] = false
		try {
			await axios({
				method: 'post',
				url: "https://twitter.com/i/api/1.1/friendships/create.json",
				data: `
					include_profile_interstitial_type=1
					&include_blocking=1
					&include_blocked_by=1
					&include_followed_by=1
					&include_want_retweets=1
					&include_mute_edge=1
					&include_can_dm=1
					&include_can_media_tag=1
					&include_ext_has_nft_avatar=1
					&skip_status=1
					&user_id=${acc_id}
				`,
				headers: this.headers,
				proxy: this.proxy
			})
			ret['follow'] = true
			return (ret);
		} catch (e) {
			console.log(e)
			return (ret)
		}
	}
	async badge() {
		this.headers['content-type'] = ""
		try {
			var web = await axios({
				method: 'get',
				url: 'https://twitter.com/i/api/2/badge_count/badge_count.json?supports_ntab_urt=1',
				headers: this.headers,
				proxy: this.proxy
			})
			return (web.data);
		} catch (e) { return ("NO") }
	}
	async get_ids() {
		this.img_id = await sc.aggregate([{ $match: {tweet_id: this.tweet_id}}, { $sample: { size: 1 } }]).then((x) => x[0].image_id)
		this.size_img = await sc.findOne({image_id: this.img_id}).then((x) => {
			this.base64_img = x.base64_img
			let file = Buffer.from(this.base64_img, "base64");

			return (Buffer.byteLength(file))
		})
		var response = await axios({
			method: "POST",
			url: "https://upload.twitter.com/i/media/upload.json",
			params: {
				command: "INIT",
				total_bytes: this.size_img,
				media_type: "image/jpeg",
				media_category: "tweet_image"
			},
			headers: this.headers,
			proxy: this.proxy
		})
		this.media_id = response.data.media_id_string
	}
	async upload_media() {
		await this.get_ids()
		var file = Buffer.from(this.base64_img, "base64");
		const form = new FormData()
		form.append('media', file, "blob")

		this.headers['content-type'] = form.getHeaders()['content-type']
		var response = await axios({
			method: "POST",
			url: `https://upload.twitter.com/i/media/upload.json`,
			params: {
				command: "APPEND",
				media_id: this.media_id,
				segment_index: 0,
			},
			data: form,
			headers: this.headers,
			proxy: this.proxy
		})
		var web = await axios({
			method: "POST",
			url: "https://upload.twitter.com/i/media/upload.json",
			params: {
				command: "FINALIZE",
				media_id: this.media_id,
			},
			headers: this.headers,
			proxy: this.proxy
		})
		return (this.media_id)
	}
}

module.exports = twit