var cron = require('node-cron');
require("dotenv").config();
const ga = require('./../mongo/giveaway.js')
const {tweet} = require('./../twitter_wrapper.js')

module.exports = () => {
	cron.schedule("0 */4 * * *", async() => {
		var time = Date.now()
		var twit = new tweet(process.env.TWITTER)
		var lst = await ga.find({draw: {$lte: time}})
		if (lst.length != 0)
			for (let x in lst) {
				await twit.check_win(lst[x])
			}
	})
}