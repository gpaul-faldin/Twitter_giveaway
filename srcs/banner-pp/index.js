/*
	REQUIRE
*/

const chance = require('chance').Chance()
const fs = require('fs')
const path = require('path');
const axios = require('axios').default

/*
	CLASS
*/

class picture {
	constructor() {
		this.pp_path = __dirname + '/db/pp/'
		this.pp_files = fs.readdirSync(this.pp_path)
		this.pp_size = this.nb_file(this.pp_path)
		this.banner_path = __dirname + '/db/banner/'
		this.banner_files = fs.readdirSync(this.banner_path)
		this.banner_size = this.nb_file(this.banner_path)
	}
	nb_file(dir) {
		const files = fs.readdirSync(dir)
		return (files.length)
	}
	draw_int(max) {
		return (chance.integer({min: 0, max: max - 1}))
	}
	get_pp() {
		return (this.pp_path + this.pp_files[this.draw_int(this.pp_size)])
	}
	get_banner() {
		return (this.banner_path + this.banner_files[this.draw_int(this.banner_size)])
	}
	get_bio() {
		return(bio[chance.integer({min: 0, max: bio.length - 1})])
	}
	get_name() {
		return (chance.first())
	}
}

class unsplash {
	constructor(key, query, count, sex) {
		this.key = key,
		this.query = query,
		this.sex = sex
		this.count = count
	}
	async retrieve_pic() {
		var prom = []
		try {var web = await axios.get(`https://api.unsplash.com/photos/random?client_id=${this.key}&query=${this.query}&count=${this.count}`)}
		catch(e) {
			console.log("error while retrieving pic")
			return (1)
		}
		web = web.data
		for (let x in web) {
			if (this.check_if_exist(web[x].id) == 0) {
				prom.push(this.download_pic(web[x].urls['small'], process.cwd() + `/db/pp`, this.get_name(web[x].id)))
			}
		}
		console.log(`${prom.length} pictures retrieved on ${this.count}`)
		await Promise.all(prom)
	}
	check_if_exist(id) {
		var db = JSON.parse(fs.readFileSync(process.cwd() + `/db/unsplash_id.json`, "utf8"))

		if (db.includes(id) == false) {
			db.push(id)
			fs.writeFileSync(process.cwd() + `/db/unsplash_id.json`, JSON.stringify(db, null, '	'), {flags:"w"});
			return (0)
		}
		return (1)
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
	get_name(id) {
		if (this.sex == 'f')
			return ("f-" + id + ".png")
		return ("h-" + id + ".png")
	}
}

/*
	UNSPLASH
*/

(async() => {

	var tmp = new unsplash(require('../../tokens/unsplash.json')["client_id"], "teenage girl portrait", "30", "f")
	await tmp.retrieve_pic()

})();

/*
	EXPORT
*/

module.exports = {picture}

/*
	QUOTES
*/

let bio = [
	"What should I put here?",
	" *Insert clever bio here*",
	"A human. Being.",
	"  Welcome to my world.",
	"One of a kind.",
	"Insert pretentious stuff about myself here",
	"I'm real and I hope some of my followers are too.",
	"Catch flights not feelings.",
	"I'd rather steal your dessert than your boyfriend",
	"Sweet as sugar, tough as nails",
	"Born to express, not impress",
	"I can't remember who I stole my bio from or why",
	"We are all part of the ultimate statistic - ten out of ten die",
	"I'm cool, but global warming made me HOT",
	"Namast'ay in bed",
	"Simple but significant",
	"Livin' a little",
	"99% caffeine",
	"Spreading smiles",
	"Slow down",
	"A human. Being",
	"Too rad to be sad",
	"Conquer from within",
	"Anything but predictable",
	"Born to shine",
	"Love without limits",
	"I got nothing",
	"This is me",
	"Wake. Play. Slay",
	"Welcome to my world",
	"One of a kind",
	"The best revenge is massive success",
	"Eat, sleep, create, repeat",
	"If I cannot do great things, I can do small things in a great way",
	"You are never too old to set another goal or to dream a new dream",
	"It wasn't always easy but it's worth it",
	"Always aiming to be a rainbow at the end of a thunderstorm",
	"Die having memories, don't die with just dreams",
	"Take care of your body; it's the only place you have to live",
	"My goal is to create a life that I don't want to take a vacation from",
	"Your best teacher is your last mistake",
	"With confidence, you have won before you have started",
	"Don't look for society to give you permission to be yourself",
	"My greatest fear isn't starting. My greatest fear is not making it to the top",
	"When the pain passes, you eventually see how much good came out of a bad situation",
	"I am worthy of the greatness I hold",
	"I don't know where I'm going but I can hear my way around",
	"Fill your life with experiences so you always have a great story to tell",
	"I strive to impress myself",
	"Be a warrior, not a worrier",
	"Do something today that your future self will thank you for",
	"ife's uncertain. Eat dessert first",
	"A balanced diet is a cookie in each hand",
	"The secret ingredient is always cheese",
	"I followed my heart and it led me to the fridge",
	"Don't go bacon my heart",
	"I apologize for anything I post while hungry",
	"Pretty much just pictures of food and my dog",
	"Hi, my hobbies include breakfast, lunch and dinner",
	"Recovering donut addict",
	"My mission in life is not merely to survive but thrive",
	"Everything has beauty but not everyone can see",
	"Remember to always be yourself",
	"Happiness often sneaks in through a door you didn't know you left open",
	"The bad news is time flies. The good news is you're the pilot",
	"Sometimes you will never know the value of a moment until it becomes a memory",
	"Follow Me To Greatness",
	"Thank you, come again",
	"Don't know what to do? You can start by hitting that follow button",
	"Wanna know my story? Press that follow button",
	"I'm on my journey. Join me by following along",
	"My story will inspire you so be sure to hit that follow button",
	"Follow me to get a behind the scenes look at my life",
	"Follow along to witness history in the making",
	"So many of my smiles are because of you",
	"So grateful to be sharing my world with you",
	"All your dreams can come true and I'll make sure of it",
	"Live in the sunshine where you belong",
	"My life is better than my daydreams",
	"Sprinkling kindness everywhere I go",
	"I love my followers more than life itself",
	"Don't regret the opportunities you were too afraid to take",
	"Sometimes we could always use a little magic - don't hide the magic within you",
	"Every day might not be a good day but there is good in every day",
	"I am unique and I'm also one of a kind. Make sure you don't forget that",
	"I feel so sorry for the people who do not know me. They lost diamonds",
	"I really do not need to explain myself. I know I am always right",
	"My life. My choices. My mistakes. My lessons. Not your business. Move on with your life",
	"In just three words, I can sum up the things I have learned about life: it goes on",
	"I'm afflicted with Awesome. There's no curing it",
	"You're not gonna tell me who I am. I'm gonna tell you who I am",
	"I am a rare species, not a stereotype",
	"Everyone has weaknesses, but I'm not everyone",
	"I'm not ashamed to be me. What's wrong with being unique?",
	"If you hate me - Log on to KISS-MY-ASS.com",
	"I'm one of a kind and I'm unique. Never forget that",
	"I feel sorry for people who don't know me",
	"My life, My choices, My mistakes, My lessons, Not your business",
	"I won't change - I was 'being grown' and not being adjusted to the opinion of the others",
	"I'm not going to change; I'm very stubborn in this way. I am what I am",
	"I do not exist to impress the world. I exist to live my life in a way that will make me happy",
	"My haters are my biggest motivators",
	"Living my dreams",
	"WiFi + food + my bed = PERFECTION",
	"Don't like me? Don't care",
	"Bad decisions make for the best stories",
	"Keep the dream alive: Hit the snooze button",
	"I smile because I have no idea what is going on anymore",
	"Naturally and artificially flavored",
	"God gave me a lot of hair, but not a lot of height",
	"Acting like summer & walking like rain",
	"A Nomad in search of the perfect burger",
	"Never forget, the world is yours. Terms and conditions may apply",
	"My blood is made of coffee",
	"Maybe I'm born with it",
	"You can't make everybody happy, you aren't a jar of Nutella",
	"Give me the chocolate and nobody will get hurt",
	"The future is shaped by your dreams. Stop wasting time and go to sleep",
	"This is my simple Coffee dependent life",
	"I need 6 months of vacation twice a year",
	"Risk-taker. Adventurer. Globetrotter",
	"Living my life on my own terms",
	"I might look like I'm doing nothing, but in my head, I'm quite busy",
	"Life is either a daring adventure or nothing at all",
	"I got here by being me, so I'll continue being me",
	"Be all in or get out. There is no in-between",
	"Daydreamer, night thinker",
	"Nothing is eternal",
	"Go wild for a while",
	"Nobody is perfect",
	"Stay classy",
	"There is beauty in simplicity",
	"As free as the ocean",
	"Doing all things with kindness",
	"Single, focused, blessed. Living life",
	"My standards are high. Just like my heels",
	"A messy bun and having fun",
	"Voice of the wild within every woman",
	"I am a girl. I don't smoke, drink or party every weekend. I don't sleep around or start drama to get attention. Yes, we do still exist!",
	"Who cares, I am awesome",
	"Girls don't wait for the prince anymore. They just pack and travel the world",
	"Hey, you are reading my bio again?",
	"This isn't rocket science, you take a photo of brunch and you hashtag #yolo #sundayfunday",
	"Stay strong, the weekend is coming",
	"We all start as strangers",
	"Single and ready to get nervous around anyone I find attractive",
	"You know what I like about people? Their dogs",
	"First I drink the coffee. Then I do the things",
	"I already want to take a nap tomorrow",
	"Everyday is a second chance",
	"You can't buy happiness but you can buy a plane ticket, and that's kind of the same thing",
	"Be happy. Be bright. Be YOU",
	"Be a pineapple: Stand up straight, wear a crown and always be sweet on the inside",
	"Be the reason someone believes in the goodness of people",
	"Always wear your invisible crown",
	"Travel far enough you meet yourself",
	"Kanye attitude with Drake feelings",
	"We're all just molecules",
	"Depressed, stressed, but still well dressed",
	"We are born to be real, not perfect",
	"Sand in my toes and saltwater in my curls",
	"Burn for what you love",
	"So many books, so little time",
	"To infinity and beyond",
	"I dare you to believe in yourself, You deserve all things magic",
	"Do justly. Love mercy. Walk humbly",
	"My autobiography is this mess of pics",
	"Love yourself as much as you want to be loved",
	"Create the life you can't wait to wake up to",
	"We travel not to escape life, but for life not to escape us",
	"It is less about becoming a better perso, and more of being better, as a person",
	"Being a good person does not mean you have to put up with other people's crap",
	"Be around people that make you want to be a better person, who make you feel good, make you laugh, and remind you what's important in life",
	"Be a good person. But don't waste time proving it",
	"Be the reason someone smiles today",
	"Life isn't perfect but your outfit can be",
	"Kinda classy, kinda hood",
	"I am not lazy, I am on energy saving mode",
	"Life is short, smile while you still have teeth"
	];