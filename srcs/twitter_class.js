const axios = require('axios')

class twit {
	constructor(cookies, csrf, proxy) {
		this.headers = {
			Authorization: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
			cookie: cookies,
			'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
			'content-type': "",
			'x-csrf-token': csrf
		}
		this.proxy = {
			host: proxy[0],
			prot: Number(proxy[1])
		}
	}
	async like(tweet_id) {
		this.headers['content-type'] = "application/json"
		try {
			await axios({
				method: 'post',
				url: 'https://twitter.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet',
				data: {
					"variables": {
						"tweet_id": tweet_id
					},
					"queryId": "lI07N6Otwv1PhnEgXILM7A"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			return ("OK");
		} catch (e) { return ("NO") }
	}
	async rt(tweet_id) {
		this.headers['content-type'] = "application/json"
		try {
			await axios({
				method: 'post',
				url: "https://twitter.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet",
				data: {
					"variables": {
						"tweet_id": tweet_id,
						"dark_request": false
					},
					"queryId": "lI07N6Otwv1PhnEgXILM7A"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			return ("OK");
		} catch (e) { return ("NO") }
	}
	async tag(tweet_id, text) {
		this.headers['content-type'] = "application/json"
		try {
			await axios({
				method: 'post',
				url: "https://twitter.com/i/api/graphql/l-kS-W5Ht5bBGBNp-wNzcA/CreateTweet",
				data: {
					"variables": {
						"tweet_text": text,
						"reply": {
							"in_reply_to_tweet_id": tweet_id,
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
					"queryId": "l-kS-W5Ht5bBGBNp-wNzcA"
				},
				headers: this.headers,
				proxy: this.proxy
			})
			return ("OK");
		} catch (e) { return ("NO") }
	}
	async follow(acc_id) {
		this.headers['content-type'] = 'application/x-www-form-urlencoded'
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
			return ("OK");
		} catch (e) { return ("NO") }
	}
}

module.exports = twit