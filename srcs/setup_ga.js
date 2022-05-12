/*
	REQUIRE
*/

const {actions} = require('./class.js')
const {tweet} = require('./wrapper/twitter_wrapper.js')
const user = require('./mongo/User.js')
const ga = require('./mongo/giveaway.js')
var axios = require('axios').default
const cron_ga = require('./cron/cron_class_ga.js')
var twit = new tweet(process.env.TWITTER);

/*
	MAIN
*/

async function setup_ga(url, end, nbr_acc, id, is_test) {
	var action = new actions(10);
	var nfo = await twit.get_info_tweet(id);
	var txt_split = nfo.text.split('\n');
	if (nbr_acc == 0 || nbr_acc > await user.countDocuments({old: {$eq: false}})) {
		nbr_acc = await user.countDocuments();
	};
	action.info.nbr_acc = nbr_acc;
	action.id = id;
	check_for_tag(txt_split, action);
	await check_for_follow(nfo.text, action, nfo.author_id);
	await check_for_ytb(nfo.text, action);
	await twit.fill_giveaway(action, end, url);
	if (is_test == true) {
		await ga.updateOne({tweet_id: id}, {$set: {participate: true}})
		return (0);
	}
	new cron_ga(action.id, action.info.interval, action);
	return (0);
}

/*
	MISC FCT
*/

function check_for_tag(split, action) {
	for (let x in split) {
		if (split[x].match(/tag/gi)) {
			action.tag.on = true;
			if (split[x].match(/([0-9])/g) == null)
				action.tag.nbr = 1;
			else
				action.tag.nbr = Number(split[x].match(/([0-9])/g));
		}
	}
	return (0)
}

async function check_for_follow(tweet_text, action, author_id) {
	action.follow.on = true
	action.follow.acc.push(author_id)
	var follow = tweet_text.match(/(@[A-Za-z0-9])\w+/g)
	for (let x in follow) {
		let acc_id = await twit.get_id_name(follow[x].replaceAll('@', ''))
		if (!action.follow.acc.includes(acc_id))
			action.follow.acc.push(acc_id)
	}
	return (0)
}

async function check_for_ytb(tweet_text, action) {
	var ytb = tweet_text.match(/(https:\/\/t.co\/[A-Za-z0-9])\w+/g);
	for (let x in ytb) {
		action.ytb = await check_t_co_links(ytb[x])
		if (action.ytb == true) {
			await twit.get_sc(action.id)
			break ;
		}
	}
	return (0)
}

async function check_t_co_links(url) {
	var web = await axios.get(url)
	if (web.request.host.match(/youtube/g))
		return (true)
	return (false)
}

module.exports = {
	setup_ga
}