const cp_acc = require('./mongo/copy_accounts.js')
const user = require('./mongo/User.js')
const {copy_profile} = require('./wrapper/twitter_wrapper.js')
const {add_banner,get_bio, get_banner} = require('./wrapper/pro-fill_wrapper.js')
const twit = require('./twitter_class.js')
const axios = require('axios').default
const fs = require('fs')

class copy_account {
	constructor (user_id) {
		this.user_id = user_id,
		this.cp = new copy_profile(process.env.TWITTER)
	}
	async add_to_db() {
		var acc = await this.cp.get_list_user(this.user_id)
		console.log(acc.length)

		for (let x = 0; x < acc.length; x++) {
			if (await cp_acc.findOne({ user_id: acc[x].id }).count() == 0) {
				if (acc[x].description.length == 0 || acc[x].description.match(/@|#|t.co\/\w+/g) != null)
					acc[x].description = await get_bio()
				await cp_acc.create({
					user_id: acc[x].id,
					tag: acc[x].username,
					username: acc[x].name,
					bio: acc[x].description,
					base64_user: await this.get_base64(acc[x].profile_image_url.replace('_normal.jpg', '.jpg'), acc[x].id),
					ready: false,
					used: false
				})
			}
		}
	}
	async add_banner_to_acc() {
		var acc = await cp_acc.find({ base64_banner: null })
		const chunkSize = 50;
		for (let i = 0; i < acc.length; i += chunkSize) {
			let prom = []
			const chunk = acc.slice(i, i + chunkSize);
			for (let x in chunk) {
				prom.push(this.add_banner(chunk[x]))
			}
			await Promise.all(prom)
		}
	}
	async add_banner(acc) {
		if (await this.get_banner_twitter(acc.tag, acc.user_id) == null) {
			var base64_img = await get_banner(true)
		}
		else {
			var base64_img = await this.get_banner_twitter(acc.tag, acc.user_id)
		}
		await cp_acc.updateOne(
			{
				user_id: acc.user_id
			},
			{
				$set: {
					base64_banner: base64_img,
					ready: true
				}
			}
		)
	}
	async get_banner_arr(user_id) {
		const chunkSize = 50;
		let lst = await this.cp.get_list_user(user_id)
		if (lst == null)
			return ('limit')
		for (let i = 0; i < lst.length; i += chunkSize) {
			let prom = []
			const chunk = lst.slice(i, i + chunkSize);
			for (let x in chunk) {
				prom.push(this.get_banner_twitter(chunk[x].username, chunk[x].id))
			}
			await Promise.all(prom)
		}
	}
	async get_banner_twitter(tag, user_id) {
		var acc = await user.aggregate([
			{
				$sample: { size: 1 }
			},
			{
				$lookup: {
					from: 'cookies',
					localField: 'cookies',
					foreignField: '_id',
					as: 'cookies'
				}
			}
		])
			.then((usr) => {return (usr[0])})
		let tweet = new twit(acc.cookies[0].req_cookie, acc.cookies[0].crsf, acc.proxy.split(':'), "123456")
		var banner_url = await tweet.get_banner(tag)
		if (banner_url != null) {
			let base64_img = await this.get_base64(banner_url, user_id)
			if (base64_img != null) {
				await add_banner(user_id, base64_img)
				return (base64_img)
			}
		}
		return (null)
	}
	async get_base64(url, user_id) {
		var re = ""
		const path = "srcs/img/" + user_id + ".jpg"
		if (await this.downloadImage(url, path) == 0) {
			var re = fs.readFileSync(path, {encoding: 'base64'})
			fs.unlinkSync(path)
			return (re)
		}
		return (null)
	}
	async downloadImage(url, path) {
		return new Promise(async (resolve, reject) => {
			try {
				const response = await axios({
					method: 'GET',
					url: url,
					responseType: 'stream',
				})
				response.data.pipe(fs.createWriteStream(path))
					.once('close', () => resolve(0))
			} catch (e) { resolve(null) }
		});
	}
}

module.exports = copy_account