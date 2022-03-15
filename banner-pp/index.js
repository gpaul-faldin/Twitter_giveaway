const chance = require('chance').Chance()
const fs = require('fs')

class info {
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
}

exports.picture = info