import bcrypt from "bcrypt";

const saltRounds = 10;

export async function hashPassword(password: string) {
	return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}
