import slugify from "slugify";

export function sluggy(name: string) {
	return slugify(name, {
		replacement: '-',  // replace spaces with replacement character, defaults to `-`
		remove: undefined, // remove characters that match regex, defaults to `undefined`
		lower: true,      // convert to lower case, defaults to `false`
		strict: false,     // strip special characters except replacement, defaults to `false`
		locale: 'vi',      // language code of the locale to use
		trim: true         // trim leading and trailing replacement chars, defaults to `true`
	})
}

export function currentdate() {
	return String(
		(new Date().toISOString()).slice(0, 10).split('-').reverse()
	)
}

export function checkIfExistsAndIsInteger(val: Array<number | string | null>) {
	return val.map(stak => stak && !Number.isInteger(Number(stak)))
}