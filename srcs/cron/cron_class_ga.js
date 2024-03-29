var cron = require('node-cron');
const User = require('../mongo/User.js')
const ga = require('../mongo/giveaway.js')
const {Webhook} = require('simple-discord-webhooks');
const axios = require('axios')
const Chance = require('chance')
require("dotenv").config();

const chance = new Chance()
const webhook = new Webhook(process.env.HOOK)

class cron_ga {
	constructor(ga_id, interval, action) {
		this.job = this.create_cron_ga(ga_id, interval)
		this.action = action
	}
	create_cron_ga(ga_id, interval) {
		if (interval > 59)
			interval = 59
		if (interval < 1)
			interval = 1
		var re = new cron.schedule(`*/${interval} * * * *`, async () => {
			await this.sleep()
			var lst = await ga.findOne({ tweet_id: ga_id })
			if (lst.info.nbr_parti == lst.info.nbr_acc) {
				await ga.updateOne(lst, { $set: { participate: true } })
				webhook.send(`Participations finished for ${lst.tweet_url}`)
				this.del_job()
				return (1)
			}
			var acc = await User.find({user: {$nin: lst.info.acc}, old: {$ne: true}}, { tag: 1 })
				.then((x) => {
					var random = Math.floor(Math.random() * x.length);
					return x[random].tag
				})
			try {
				await axios({
					method: 'post',
					url: `http://twitter.faldin.xyz/api/start`,
					data: {
						mode: 'spe',
						opt: acc,
						action: lst.action
					},
					headers: {
						Authorization: "Bearer " + process.env.ADM_TOKEN
					}
				})
			} catch (e) { console.log(e)}
		})
		return (re)
	}
	del_job() {
		this.job.stop();
		delete this.job;
	}
	sleep() {
		return new Promise((resolve) => {
			setTimeout(resolve, chance.integer({min: 1000, max: 15000}));
		});
	}
}

module.exports = cron_ga