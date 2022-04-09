var cron = require('node-cron');
var axios = require('axios').default
require("dotenv").config();

module.exports = () => {
	cron.schedule("*/15 * * * *", async() => {
		await axios.put('http://twitter.faldin.xyz/api/update/twitter?opt=2', {}, {
			headers: {
				'Authorization': "Bearer " + process.env.ADM_TOKEN
			}
		})
		await axios.put('http://twitter.faldin.xyz/api/update/twitter?opt=1', {}, {
			headers: {
				'Authorization': "Bearer " + process.env.ADM_TOKEN
			}
		})
	})
}