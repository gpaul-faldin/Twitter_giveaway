var cron = require('node-cron');
var user = require('./../mongo/User.js')
require("dotenv").config();

module.exports = () => {
	cron.schedule("0 * * * *", async() => {
		var lst = await user.find({timeout: true})
		for (let x in lst) {
			if (lst[x].end_timeout <= Date.now())
				await user.updateOne({user: lst[x].user}, {$set: {timeout: false, end_timeout: 0}})
		}
	})
}