/*
	REQUIRE
*/

const chance = require('chance').Chance()
const fs = require('fs')
const path = require('path');
const axios = require('axios').default
const {getGender} = require('gender-detection-from-name');


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
	get_pp(name) {
		var sex = "n"
		var file = ""

		if (getGender(this.get_name_from_tag(name)) == "female")
			sex = "f"
		else if (getGender(this.get_name_from_tag(name)) == "male")
			sex = "m"
		while (file[0] != sex && file[0] != 'n') {
			file = this.pp_files[this.draw_int(this.pp_size)]
		}
		return (this.pp_path + file)
	}
	get_banner() {
		return (this.banner_path + this.banner_files[this.draw_int(this.banner_size)])
	}
	get_bio() {
		return(bio[chance.integer({min: 0, max: bio.length - 1})])
	}
	get_name(name) {
		return (this.get_name_from_tag(name))
	}
	get_name_from_tag(user) {
		var re = ""
		for(let i in user) {
			if ((/^[a-zA-Z]+$/.test(user[i]) && i == 0) || (/^[a-z]+$/.test(user[i])))
				re += user[i]
			else
				break ;
		}
		return (re)
	}
}

class unsplash {
	constructor(key, query, count, sex, orient) {
		this.key = key,
		this.query = query,
		this.sex = sex
		this.count = count
		if (orient == 0)
			this.orient = "portrait"
		else
			this.orient = "landscape"
	}
	async retrieve_pic() {
		var prom = []
		var path = process.cwd() + `/db/pp`
		var size = "small"
		this.orient == "landscape" ? size = "regular" : 0
		if (this.sex != 'm' && this.sex != 'f' && this.sex != 'n')
			path = process.cwd() + `/db/banner`
		try {var web = await axios.get(`https://api.unsplash.com/photos/random?client_id=${this.key}&query=${this.query}&count=${this.count}&orientation=${this.orient}`)}
		catch(e) {
			console.log("error while retrieving pic")
			return (1)
		}
		web = web.data
		for (let x in web) {
			if (this.check_if_exist(web[x].id) == 0) {
				prom.push(this.download_pic(web[x].urls[size], path, this.get_name(web[x].id)))
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
		if (this.sex == 'm')
			return ("m-" + id + ".png")
		if (this.sex == 'n')
			return ("n-" + id + ".png")
		else
			return ("b-" + id + ".png")
	}
}


class legit_at {
	constructor(legit) {
		this.size_csgo = this.draw_int(8),
		this.csgo = Object.keys(legit.csgo)
		this.size_news = this.draw_int(2),
		this.news = Object.keys(legit.news)
		this.size_crypto = this.draw_int(10),
		this.crypto = Object.keys(legit.crypto)
		this.size_giveaway = this.draw_int(5)
		this.giveaway = Object.keys(legit.giveaway)
	}
	draw_int(max) {
		return (chance.integer({min: 1, max: max}))
	}
	size_arr(arr) {
		var i = 0
		for (let x in arr) {
			i++;
		}
		return (i)
	}
	give_arr() {
		var re = []
		var	i = 0

		while (i < this.size_csgo) {
			var rand = this.draw_int(this.csgo.length)
			if (re.includes(this.csgo[rand]) == false) {
				re.push(this.csgo[rand])
			}
			i++;
		}
		i = 0
		while (i < this.size_news) {
			var rand = this.draw_int(this.news.length)
			if (re.includes(this.news[rand]) == false) {
				re.push(this.news[rand])
			}
			i++;
		}
		i = 0
		while (i < this.size_crypto) {
			var rand = this.draw_int(this.crypto.length)
			if (re.includes(this.crypto[rand]) == false) {
				re.push(this.crypto[rand])
			}
			i++;
		}
		i = 0
		while (i < this.size_giveaway) {
			var rand = this.draw_int(this.giveaway.length)
			if (re.includes(this.giveaway[rand]) == false) {
				re.push(this.giveaway[rand])
			}
			i++;
		}
		re.push('CSGO')
		return (re)
	}
}

/*
	UNSPLASH
*/

// (async() => {

//	var tmp = new unsplash(require('../../tokens/unsplash.json')["client_id"], "nature", "30", "n", 0)
//	await tmp.retrieve_pic()

// })();

/*
	EXPORT
*/

module.exports = {picture, legit_at}

/*
	QUOTES
*/

let bio = [
	"Love yourself first and everything else falls into line. You really have to love yourself to get anything done in this world.",
	"Our character is what we do when we think no one is looking.",
	"Life is a travelling to the edge of knowledge, then a leap taken.",
	"Knowing your own darkness is the best method for dealing with the darkness of other people.",
	"I do not believe in a fate that falls on men however they act; but I do believe in a fate that falls on man unless they act.",
	"I don't want to achieve immortality through my work... I want to achieve it through not dying.",
	"The person who makes a success of living is the one who see his goal steadily and aims for it unswervingly. That is dedication.",
	"So long as a person is capable of self-renewal they are a living being.",
	"The best preparation for tomorrow is doing your best today.",
	"Knowing others is wisdom, knowing yourself is Enlightenment.",
	"With the new day comes new strength and new thoughts.",
	"Life is what happens while you are making other plans.",
	"To be great is to be misunderstood.",
	"Do something wonderful, people may imitate it.",
	"Wisdom ceases to be wisdom when it becomes too proud to weep, too grave to laugh, and too selfish to seek other than itself.",
	"Technological progress has merely provided us with more efficient means for going backwards.",
	"If I am not for myself, who will be for me? If I am not for others, what am I? And if not now, when?",
	"Simply put, you believer that things or people make you unhappy, but this is not accurate. You make yourself unhappy.",
	"The world is round and the place which may seem like the end may also be the beginning.",
	"Be not afraid of greatness: some are born great, some achieve greatness, and some have greatness thrust upon them.",
	"The final wisdom of life requires not the annulment of incongruity but the achievement of serenity within and above it.",
	"Friendship multiplies the good of life and divides the evil.",
	"Friends are the siblings God never gave us.",
	"When deeds and words are in accord, the whole world is transformed.",
	"The dream was always running ahead of me. To catch up, to live for a moment in unison with it, that was the miracle.",
	"How far that little candle throws its beams! So shines a good deed in a naughty world.",
	"If you aren't going all the way, why go at all?",
	"Friendship is also about liking a person for their failings, their weakness. It's also about mutual help, not about exploitation.",
	"Opportunity often comes disguised in the form of misfortune, or temporary defeat.",
	"To accomplish great things, we must dream as well as act.",
	"All the world is a stage, And all the men and women merely players. They have their exits and entrances; Each man in his time plays many parts.",
	"For every failure, there's an alternative course of action. You just have to find it. When you come to a roadblock, take a detour.",
	"Wisdom is nothing but a preparation of the soul, a capacity, a secret art of thinking, feeling and breathing thoughts of unity at every moment of life.",
	"Technology has to be invented or adopted.",
	"I gave my life to become the person I am right now. Was it worth it?",
	"Freedom is not worth having if it does not connote freedom to err.",
	"Treat people as if they were what they ought to be, and you help them to become what they are capable of being.",
	"How many cares one loses when one decides not to be something but to be someone.",
	"To be fully alive, fully human, and completely awake is to be continually thrown out of the nest.",
	"The greater our knowledge increases the more our ignorance unfolds.",
	"You only lose what you cling to.",
	"It always seems impossible until it's done.",
	"All that we see or seem is but a dream within a dream.",
	"A monarchy conducted with infinite wisdom and infinite benevolence is the most perfect of all possible governments.",
	"The winds and waves are always on the side of the ablest navigators.",
	"Great ideas often receive violent opposition from mediocre minds.",
	"You give before you get.",
	"A long habit of not thinking a thing wrong gives it a superficial appearance of being right.",
	"It is the mark of an educated mind to be able to entertain a thought without accepting it.",
	"The great myth of our times is that technology is communication.",
	"Love is blind; friendship closes its eyes.",
	"The greatest discovery of our generation is that human beings can alter their lives by altering their attitudes of mind. As you think, so shall you be.",
	"The aim of life is self-development. To realize one's nature perfectly - that is what each of us is here for.",
	"Reality does not conform to the ideal but confirms it.",
	"The mind is everything. What you think you become.",
	"Be like the flower, turn your face to the sun.",
	"The more light you allow within you, the brighter the world you live in will be.",
	"If you are bitter, you are like a dry leaf that you can just squash, and you can get blown away by the wind. There is much more wisdom in forgiveness.",
	"What we achieve inwardly will change outer reality.",
	"I'm not interested in age. People who tell me their age are silly. You're as old as you feel.",
	"Ethics change with technology.",
	"To go against the dominant thinking of your friends, of most of the people you see every day, is perhaps the most difficult act of heroism you can perform.",
	"The wisdom of the wise, and the experience of ages, may be preserved by quotation.",
	"Let us always meet each other with smile, for the smile is the beginning of love.",
	"Luck is what happens when preparation meets opportunity.",
	"It is more shameful to distrust our friends than to be deceived by them.",
	"All achievements, all earned riches, have their beginning in an idea.",
	"Of course there is no formula for success except perhaps an unconditional acceptance of life and what it brings.",
	"The grand essentials of happiness are: something to do, something to love, and something to hope for.",
	"The greatest achievement of humanity is not its works of art, science, or technology, but the recognition of its own dysfunction.",
	"When I dare to be powerful, to use my strength in the service of my vision, then it becomes less and less important whether I am afraid.",
	"No man can succeed in a line of endeavor which he does not like.",
	"You can observe a lot just by watching.",
	"The minute you settle for less than you deserve, you get even less than you settled for.",
	"It has never been my object to record my dreams, just to realize them.",
	"If it is not right do not do it; if it is not true do not say it.",
	"Peace begins with a smile.",
	"Fears are nothing more than a state of mind.",
	"One's philosophy is not best expressed in words; it is expressed in the choices one makes... and the choices we make are ultimately our responsibility.",
	"Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.",
	"Life is the flower for which love is the honey.",
	"The best way to predict your future is to create it.",
	"The future belongs to those who believe in the beauty of their dreams.",
	"It is only the great hearted who can be true friends. The mean and cowardly, can never know what true friendship means.",
	"I'll prepare and someday my chance will come.",
	"The pessimist sees difficulty in every opportunity. The optimist sees the opportunity in every difficulty.",
	"Sometimes your joy is the source of your smile, but sometimes your smile can be the source of your joy.",
	"Freedom is what you do with what's been done to you.",
	"Programs must be written for people to read, and only incidentally for machines to execute.",
	"To see things in the seed, that is genius.",
	"So much technology, so little talent.",
	"Always be mindful of the kindness and not the faults of others.",
	"Gratitude is the fairest blossom which springs from the soul.",
	"How wonderful it is that nobody need wait a single moment before starting to improve the world.",
	"You are important enough to ask and you are blessed enough to receive back.",
	"Success is getting what you want. Happiness is wanting what you get.",
	"All that is necessary is to accept the impossible, do without the indispensable, and bear the intolerable.",
	"He who has imagination without learning has wings but no feet.",
	"When you have got an elephant by the hind legs and he is trying to run away, it's best to let him run.",
	"The person born with a talent they are meant to use will find their greatest happiness in using it.",
	"Lord, make me an instrument of thy peace. Where there is hatred, let me sow love.",
	"As you walk in God's divine wisdom, you will surely begin to see a greater measure of victory and good success in your life.",
	"The smallest flower is a thought, a life answering to some feature of the Great Whole, of whom they have a persistent intuition.",
	"Life shrinks or expands in proportion to one's courage.",
	"It had long since come to my attention that people of accomplishment rarely sat back and let things happen to them. They went out and happened to things.",
	"Parents can only give good advice or put them on the right paths, but the final forming of a person's character lies in their own hands.",
	"Kind words can be short and easy to speak, but their echoes are truly endless.",
	"It isn't what happens to us that causes us to suffer; it's what we say to ourselves about what happens.",
	"You can tell whether a man is clever by his answers. You can tell whether a man is wise by his questions.",
	"What do we live for, if it is not to make life less difficult for each other?",
	"Everyone has been made for some particular work, and the desire for that work has been put in every heart.",
	"Peace cannot be kept by force. It can only be achieved by understanding.",
	"Look back over the past, with its changing empires that rose and fell, and you can foresee the future, too.",
	"If you look into your own heart, and you find nothing wrong there, what is there to worry about? What is there to fear?",
	"It all depends on how we look at things, and not how they are in themselves.",
	"Friendship is Love without his wings!",
	"Good actions give strength to ourselves and inspire good actions in others.",
	"Imagination allows us to escape the predictable. It enables us to reply to the common wisdom that we cannot soar by saying, 'Just watch!'",
	"If I know what love is, it is because of you.",
	"The World is my country, all mankind are my brethren, and to do good is my religion.",
	"If you correct your mind, the rest of your life will fall into place.",
	"To be what we are, and to become what we are capable of becoming, is the only end of life.",
	"All great men are gifted with intuition. They know without reasoning or analysis, what they need to know.",
	"Happiness can exist only in acceptance.",
	"He who experiences the unity of life sees his own Self in all beings, and all beings in his own Self, and looks on everything with an impartial eye.",
	"You know you're in love when you can't fall asleep because reality is finally better than your dreams.",
	"Things do not change; we change.",
	"Learning never exhausts the mind.",
	"Do not be embarrassed by your mistakes. Nothing can teach us better than our understanding of them. This is one of the best ways of self-education.",
	"Time changes everything except something within us which is always surprised by change.",
	"By living deeply in the present moment we can understand the past better and we can prepare for a better future.",
	"Speak low, if you speak love.",
	"Change your thoughts and you change your world.",
	"It's important to know that words don't move mountains. Work, exacting work moves mountains.",
	"He who talks more is sooner exhausted.",
	"Problems are only opportunities with thorns on them.",
	"The world turns aside to let any man pass who knows where he is going.",
	"Nothing ever goes away until it has taught us what we need to know.",
	"Friendship needs no words - it is solitude delivered from the anguish of loneliness.",
	"To hell with circumstances, I create opportunities.",
	"The possession of knowledge does not kill the sense of wonder and mystery. There is always more mystery.",
	"Not all those who wander are lost.",
	"Trust your hunches. They're usually based on facts filed away just below the conscious level.",
	"Friendship always benefits; love sometimes injures.",
	"The ultimate promise of technology is to make us master of a world that we command by the push of a button.",
	"Memory is the mother of all wisdom.",
	"The beginning of knowledge is the discovery of something we do not understand.",
	"Goals are the fuel in the furnace of achievement.",
	"Try not to become a man of success, but rather try to become a man of value.",
	"What is new in the world? Nothing. What is old in the world? Nothing. Everything has always been and will always be.",
	"One secret of success in life is for a man to be ready for his opportunity when it comes.",
	"You're never a loser until you quit trying.",
	"Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
	"First say to yourself what you would be; and then do what you have to do.",
	"Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
	"Argue for your limitations, and sure enough they're yours.",
	"The thought manifests as the word. The word manifests as the deed. The deed develops into habit. And the habit hardens into character.",
	"Never explain - your friends do not need it and your enemies will not believe you anyway.",
	"Ability will never catch up with the demand for it.",
	"When you see a good person, think of becoming like him. When you see someone not so good, reflect on your own weak points.",
	"We must not allow ourselves to become like the system we oppose.",
	"Make the best use of what is in your power and take the rest as it happens.",
	"No garden is without its weeds.",
	"Does wisdom perhaps appear on the earth as a raven which is inspired by the smell of carrion?",
	"All perceiving is also thinking, all reasoning is also intuition, all observation is also invention.",
	"Happiness mainly comes from our own attitude, rather than from external factors.",
	"If you change the way you look at things, the things you look at change.",
	"He who knows others is wise. He who knows himself is enlightened.",
	"Avoid having your ego so close to your position that when your position falls, your ego goes with it.",
	"No man was ever wise by chance.",
	"When the solution is simple, God is answering.",
	"The deepest craving of human nature is the need to be appreciated.",
	"Consider that not only do negative thoughts and emotions destroy our experience of peace, but they also undermine our health.",
	"Who sows virtue reaps honor.",
	"The wise man does not lay up his own treasures. The more he gives to others, the more he has for his own.",
	"Stay away from what might have been and look at what will be.",
	"No man is free who is not master of himself.",
	"Your body is precious. It is our vehicle for awakening. Treat it with care.",
	"Build a better mousetrap and the world will beat a path to your door.",
	"Imagination is the highest kite one can fly.",
	"Men of perverse opinion do not know the excellence of what is in their hands, till someone dash it from them.",
	"More often than not, anger is actually an indication of weakness rather than of strength.",
	"Your sacred space is where you can find yourself again and again.",
	"Remember always that you not only have the right to be an individual, you have an obligation to be one.",
	"I will give you a definition of a proud man: he is a man who has neither vanity nor wisdom one filled with hatreds cannot be vain, neither can he be wise.",
	"The superior man is satisfied and composed; the mean man is always full of distress.",
	"I have an everyday religion that works for me. Love yourself first, and everything else falls into line.",
	"You can do it if you believe you can!",
	"Take no thought of who is right or wrong or who is better than. Be not for or against.",
	"In the sky, there is no distinction of east and west; people create distinctions out of their own minds and then believe them to be true.",
	"The place to improve the world is first in one's own heart and head and hands.",
	"Man is not sum of what he has already, but rather the sum of what he does not yet have, of what he could have.",
	"Cunning... is but the low mimic of wisdom.",
	"If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart.",
	"Even if you're on the right track, you'll get run over if you just sit there.",
	"It's not what you look at that matters, it's what you see.",
	"Work while you have the light. You are responsible for the talent that has been entrusted to you.",
	"If we could see the miracle of a single flower clearly, our whole life would change.",
	"The sum of wisdom is that time is never lost that is devoted to work.",
	"Meaning is not what you start with but what you end up with.",
	"Believe deep down in your heart that you're destined to do great things.",
	"There is not one big cosmic meaning for all, there is only the meaning we each give to our life.",
	"I know where I'm going and I know the truth, and I don't have to be what you want me to be. I'm free to be what I want.",
	"The mind unlearns with difficulty what it has long learned.",
	"A house divided against itself cannot stand.",
	"Happiness does not come from having much, but from being attached to little.",
	"The real danger is not that computers will begin to think like men, but that men will begin to think like computers.",
	"Action is eloquence.",
	"Wise men make more opportunities than they find.",
	"When I let go of what I am, I become what I might be.",
	"I don't believe in failure. It's not failure if you enjoyed the process.",
	"As an organizer I start from where the world is, as it is, not as I would like it to be.",
	"Keep silence for the most part, and speak only when you must, and then briefly.",
	"An idea that is developed and put into action is more important than an idea that exists only as an idea.",
	"No one can make you feel inferior without your consent.",
	"Friendship is like money, easier made than kept.",
	"We must never forget that it is through our actions, words, and thoughts that we have a choice.",
	"Vanity can easily overtake wisdom. It usually overtakes common sense.",
	"Allow the world to live as it chooses, and allow yourself to live as you choose.",
	"Our doubts are traitors and make us lose the good we often might win, by fearing to attempt.",
	"To bring anything into your life, imagine that it's already there.",
	"Nature and books belong to the eyes that see them.",
	"To avoid criticism, do nothing, say nothing, be nothing.",
	"I hope our wisdom will grow with our power, and teach us, that the less we use our power the greater it will be.",
	"The only way to have a friend is to be one.",
	"TV and the Internet are good because they keep stupid people from spending too much time out in public.",
	"He has no enemies, but is intensely disliked by his friends.",
	"Life is a gift, and it offers us the privilege, opportunity, and responsibility to give something back by becoming more",
	"Ability is what you're capable of doing. Motivation determines what you do. Attitude determines how well you do it.",
	"Let me tell you the secret that has led me to my goal: my strength lies solely in my tenacity.",
	"Trust only movement. Life happens at the level of events, not of words. Trust movement.",
	"A friend is, as it were, a second self.",
	"Our intention creates our reality.",
	"Learning is finding out what you already know.",
	"Technology… is a queer thing. It brings you great gifts with one hand, and it stabs you in the back with the other.",
	"He who knows that enough is enough will always have enough.",
	"No yesterdays are ever wasted for those who give themselves to today.",
	"A heart well prepared for adversity in bad times hopes, and in good times fears for a change in fortune.",
	"There are many ways of going forward, but only one way of standing still.",
	"Friendships are the family we make - not the one we inherit. I've always been someone to whom friendship, elective affinities, is as important as family.",
	"Until you make peace with who you are, you will never be content with what you have.",
	"We're born alone, we live alone, we die alone. Only through our love and friendship can we create the illusion for the moment that we're not alone.",
	"Give whatever you are doing and whoever you are with the gift of your attention.",
	"Only those who dare to fail greatly can ever achieve greatly.",
	"Life's challenges are not supposed to paralyze you, they're supposed to help you discover who you are.",
	"Motivation is the art of getting people to do what you want them to do because they want to do it.",
	"Those who dare to fail miserably can achieve greatly.",
	"To choose what is difficult all one's days, as if it were easy, that is faith.",
	"In friendship as well as love, ignorance very often contributes more to our happiness than knowledge.",
	"The art challenges the technology, and the technology inspires the art.",
	"Our strength grows out of our weaknesses.",
	"Imagination is not a talent of some men but is the health of every man.",
	"Better to have loved and lost, than to have never loved at all.",
	"In skating over thin ice our safety is in our speed.",
	"What worries you masters you.",
	"All men have a sweetness in their life. That is what helps them go on. It is towards that they turn when they feel too worn out.",
	"His lack of education is more than compensated for by his keenly developed moral bankruptcy.",
	"You can't choose up sides on a round world.",
	"I have learned that friendship isn't about who you've known the longest, it's about who came and never left your side.",
	"Our virtues and our failings are inseparable, like force and matter. When they separate, man is no more.",
	"Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
	"Never mistake motion for action.",
	"Be less curious about people and more curious about ideas.",
	"The opportunity for brotherhood presents itself every time you meet a human being.",
	"Accept challenges, so that you may feel the exhilaration of victory.",
	"Follow effective action with quiet reflection. From the quiet reflection will come even more effective action.",
	"Faith in oneself is the best and safest course.",
	"True happiness arises, in the first place, from the enjoyment of oneself, and in the next, from the friendship and conversation of a few select companions.",
	"He is able who thinks he is able.",
	"Ignorance never settles a question.",
	"It may happen sometimes that a long debate becomes the cause of a longer friendship. Commonly, those who dispute with one another at last agree.",
	"False friendship, like the ivy, decays and ruins the walls it embraces; but true friendship gives new life and animation to the object it supports.",
	"Wisdom begins at the end.",
	"The function of wisdom is to discriminate between good and evil.",
	"To give oneself earnestly to the duties due to men, and, while respecting spiritual beings, to keep aloof from them, may be called wisdom.",
	"The best and most beautiful things in the world cannot be seen, nor touched... but are felt in the heart.",
	"I took a speed-reading course and read 'War and Peace' in twenty minutes. It involves Russia.",
	"To enjoy life, we must touch much of it lightly.",
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
	"Life is short, smile while you still have teeth",
	"What the caterpillar calls the end of the world, the master calls a butterfly.",
	"Acquaintances we meet, enjoy, and can easily leave behind; but friendship grows deep roots.",
	"If you light a lamp for somebody, it will also brighten your path.",
	"Technology made large populations possible; large populations now make technology indispensable.",
	"Fortune befriends the bold.",
	"It is better to have enough ideas for some of them to be wrong, than to be always right by having no ideas at all.",
	"The eye sees only what the mind is prepared to comprehend.",
	"Happiness comes when your work and words are of benefit to yourself and others.",
	"Think as a wise man but communicate in the language of the people.",
	"Great minds discuss ideas; average minds discuss events; small minds discuss people.",
	"One today is worth two tomorrows.",
	"Every great advance in science has issued from a new audacity of the imagination.",
	"Love and friendship exclude each other.",
	"Bad times have a scientific value. These are occasions a good learner would not miss.",
	"Reality is merely an illusion, albeit a very persistent one.",
	"Do not overrate what you have received, nor envy others. He who envies others does not obtain peace of mind.",
	"There is only one way to happiness and that is to cease worrying about things which are beyond the power of our will.",
	"Friendship is almost always the union of a part of one mind with the part of another; people are friends in spots.",
	"The only Zen you find on the tops of mountains is the Zen you bring up there.",
	"I allow my intuition to lead my path.",
	"I am of the opinion that my life belongs to the community, and as long as I live it is my privilege to do for it whatever I can.",
	"We all grow up. Hopefully, we get wiser. Age brings wisdom, and fatherhood changes one's life completely.",
	"I do not believe in a fate that falls on men however they act; but I do believe in a fate that falls on them unless they act.",
	"Good advice is always certain to be ignored, but that's no reason not to give it.",
	"Obstacles are those frightful things you see when you take your eyes off your goal.",
	"No distance of place or lapse of time can lessen the friendship of those who are thoroughly persuaded of each other's worth.",
	"Nobody made a greater mistake than he who did nothing because he could do only a little.",
	"You won't skid if you stay in a rut.",
	"I can, therefore I am.",
	"Friendship... is not something you learn in school. But if you haven't learned the meaning of friendship, you really haven't learned anything.",
	"Anticipate the difficult by managing the easy.",
	"I am not bothered by the fact that I am unknown. I am bothered when I do not know others.",
	"I believe in one thing only, the power of human will.",
	"If you live to be a hundred, I want to live to be a hundred minus one day, so I never have to live without you.",
	"I have not failed. I've just found 10,000 ways that won't work.",
	"It is the nature of the wise to resist pleasures, but the foolish to be a slave to them.",
	"The power of intuitive understanding will protect you from harm until the end of your days.",
	"Set your goals high, and don't stop till you get there.",
	"Truth, and goodness, and beauty are but different faces of the same all.",
	"You're not obligated to win. You're obligated to keep trying to do the best you can every day.",
	"The best way to pay for a lovely moment is to enjoy it.",
	"Setting an example is not the main means of influencing another, it is the only means.",
	"It is impossible to experience one's death objectively and still carry a tune.",
	"Knowing is not enough; we must apply!",
	"Never reach out your hand unless you're willing to extend an arm.",
	"Perseverance is a great element of success. If you only knock long enough and loud enough at the gate, you are sure to wake up somebody.",
	"The secret of success is constancy to purpose.",
	"Friendship, like the immortality of the soul, is too good to be believed.",
	"To succeed, we must first believe that we can.",
	"Love isn't something you find. Love is something that finds you.",
	"Failure will never overtake me if my determination to succeed is strong enough.",
	"Music in the soul can be heard by the universe.",
	"Good luck is another name for tenacity of purpose.",
	"I love you the more in that I believe you had liked me for my own sake and for nothing else.",
	"Anything you really want, you can attain, if you really go after it.",
	"Fine words and an insinuating appearance are seldom associated with true virtue",
	"Gratitude is not only the greatest of virtues, but the parent of all the others.",
	"You cannot be lonely if you like the person you're alone with.",
	"Be miserable. Or motivate yourself. Whatever has to be done, it's always your choice.",
	"To make no mistakes is not in the power of man; but from their errors and mistakes the wise and good learn wisdom for the future.",
	"The beginning of wisdom is found in doubting; by doubting we come to the question, and by seeking we may come upon the truth.",
	"Time stays long enough for anyone who will use it.",
	"From wonder into wonder existence opens.",
	"One of the most beautiful qualities of true friendship is to understand and to be understood.",
	"Let us resolve to be masters, not the victims, of our history, controlling our own destiny without giving way to blind suspicions and emotions.",
	"Knowledge rests not upon truth alone, but upon error also.",
	"Friendship improves happiness and abates misery, by the doubling of our joy and the dividing of our grief.",
	"Formula for success: under promise and over deliver.",
	"The hours of folly are measured by the clock; but of wisdom, no clock can measure.",
	"Hope arouses, as nothing else can arouse, a passion for the possible.",
	"Friendship is one of our most treasured relationships, but it isn't codified and celebrated; it's never going to give you a party.",
	"Everyone thinks of changing the world, but no one thinks of changing himself.",
	"The doors of wisdom are never shut.",
	"You are the only person on earth who can use your ability.",
	"What lies behind us and what lies before us are small matters compared to what lies within us.",
	"Reason and free inquiry are the only effectual agents against error.",
	"The pessimist complains about the wind; the optimist expects it to change; the realist adjusts the sails.",
	"Failure doesn't mean you are a failure it just means you haven't succeeded yet.",
	"In three words I can sum up everything I've learned about life: it goes on.",
	"Every person, all the events of your life are there because you have drawn them there. What you choose to do with them is up to you.",
	"He that respects himself is safe from others; he wears a coat of mail that none can pierce.",
	"Life is really simple, but we insist on making it complicated.",
	"There is no scarcity of opportunity to make a living at what you love; there's only scarcity of resolve to make it happen.",
	"Any sufficiently advanced technology is equivalent to magic.",
	"To live a pure unselfish life, one must count nothing as one's own in the midst of abundance.",
	"The moment one gives close attention to anything, even a blade of grass, it becomes a mysterious, awesome, indescribably magnificent world in itself.",
	"Never say there is nothing beautiful in the world anymore. There is always something to make you wonder in the shape of a tree, the trembling of a leaf.",
	"Learning without reflection is a waste, reflection without learning is dangerous.",
	"Don't wait. The time will never be just right.",
	"The man who trusts men will make fewer mistakes than he who distrusts them.",
	"Nothing but heaven itself is better than a friend who is really a friend.",
	"We should not give up and we should not allow the problem to defeat us.",
	"The longer we dwell on our misfortunes, the greater is their power to harm us.",
	"Life a culmination of the past, an awareness of the present, an indication of the future beyond knowledge, the quality that gives a touch of divinity to matter.",
	"Doing what you love is the cornerstone of having abundance in your life.",
	"Happiness resides not in possessions, and not in gold, happiness dwells in the soul.",
	"Sorrow is knowledge, those that know the most must mourn the deepest, the tree of knowledge is not the tree of life.",
	"All know the way; few actually walk it.",
	"He can who thinks he can, and he can't who thinks he can't. This is an inexorable, indisputable law.",
	"Happiness is a perfume you cannot pour on others without getting a few drops on yourself.",
	"However rare true love may be, it is less so than true friendship.",
	"Respect should be earned by actions, and not acquired by years.",
	"Can miles truly separate you from friends... If you want to be with someone you love, aren't you already there?",
	"Silence is the sleep that nourishes wisdom.",
	"Courage is going from failure to failure without losing enthusiasm.",
	"With pride, there are many curses. With humility, there come many blessings.",
	"The way we communicate with others and with ourselves ultimately determines the quality of our lives.",
	"If you do not express your own original ideas, if you do not listen to your own being, you will have betrayed yourself.",
	"Tragedy is a tool for the living to gain wisdom, not a guide by which to live.",
	"It is a common experience that a problem difficult at night is resolved in the morning after the committee of sleep has worked on it.",
	"Life is the only real counselor; wisdom unfiltered through personal experience does not become a part of the moral tissue.",
	"We should not judge people by their peak of excellence; but by the distance they have traveled from the point where they started.",
	"Friendship is the marriage of the soul, and this marriage is liable to divorce.",
	"Go for it now. The future is promised to no one.",
	"In the middle of every difficulty lies opportunity.",
	"Work like you don't need the money. Love like you've never been hurt. Dance like nobody's watching.",
	"You cannot step twice into the same river, for other waters are continually flowing in.",
	"Happiness is when what you think, what you say, and what you do are in harmony.",
	"A day of worry is more exhausting than a day of work.",
	"Friendship is a very taxing and arduous form of leisure activity.",
	"Inspiration exists, but it has to find us working.",
	"Love is the master key that opens the gates of happiness.",
	"It is impossible for a man to learn what he thinks he already knows.",
	"Sustaining true friendship is a lot more challenging than we give it credit for.",
	"The only real failure in life is not to be true to the best one knows.",
	"Trust yourself. You know more than you think you do.",
	"No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.",
	"Most of the important things in the world have been accomplished by people who have kept on trying when there seemed to be no hope at all.",
	"True knowledge exists in knowing that you know nothing.",
	"Until you make peace with who you are, you'll never be content with what you have.",
	"Let there be no purpose in friendship save the deepening of the spirit.",
	"Love is never lost. If not reciprocated, it will flow back and soften and purify the heart.",
	"I have learned that to be with those I like is enough.",
	"The most precious gift we can offer anyone is our attention. When mindfulness embraces those we love, they will bloom like flowers.",
	"He who conquers others is strong; He who conquers himself is mighty.",
	"The only real mistake is the one from which we learn nothing.",
	"Who looks outside, dreams, who looks inside, awakes.",
	"If you set out to be liked, you would be prepared to compromise on anything at any time, and you would achieve nothing.",
	"The most technologically efficient machine that man has ever invented is the book.",
	"There are two kinds of failures: those who thought and never did, and those who did and never thought.",
	"It is not the possession of truth, but the success which attends the seeking after it, that enriches the seeker and brings happiness to him.",
	"Science gives us knowledge, but only philosophy can give us wisdom.",
	"Love is the flower you've got to let grow.",
	"If you don't know where you are going, you will probably end up somewhere else.",
	"Life is so constructed that an event does not, cannot, will not, match the expectation.",
	"Genuine sincerity opens people's hearts, while manipulation causes them to close.",
	"Do what you can. Want what you have. Be who you are.",
	"If you're walking down the right path and you're willing to keep walking, eventually you'll make progress.",
	"I believe that every person is born with talent.",
	"Better be ignorant of a matter than half know it.",
	"We are either progressing or retrograding all the while. There is no such thing as remaining stationary in this life.",
	"There are no strangers here; Only friends you haven't yet met.",
	"We shall never know all the good that a simple smile can do.",
	"Through perseverance many people win success out of what seemed destined to be certain failure."
];