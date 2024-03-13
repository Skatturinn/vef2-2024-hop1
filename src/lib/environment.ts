import dotenv from 'dotenv';

const DEFAULT_PORT = 3000;

dotenv.config();

export type Environment = {
	port: number,
	sessionSecret: string,
	connectionString: string
} | null

let parsedEnv: Environment = null;

export default function environment1(env: NodeJS.ProcessEnv, logger: import('./logger').Logger): Environment | null {
	if (parsedEnv) {
		return parsedEnv
	}

	const {
		PORT: port,
		SESSION_SECRET: envSessionSecret,
		DATABASE_URL: envConnectionString,
	} = env;

	let error = false;

	if (!envSessionSecret || envSessionSecret.length < 32) {
		logger.error(
			'SESSION_SECRET must be defined as string and be at least 32 characters long',
		);
		error = true;
	}

	if (!envConnectionString || envConnectionString.length === 0) {
		logger.error('DATABASE_URL must be defined as a string');
		error = true;
	}

	let usedPort;
	const parsedPort = Number.parseInt(port ?? '', 10);
	if (port && Number.isNaN(parsedPort)) {
		logger.error('PORT must be defined as a number', port);
		usedPort = parsedPort;
		error = true;
	} else if (parsedPort) {
		usedPort = parsedPort;
	} else {
		logger.info('PORT not defined, using default port', String(DEFAULT_PORT));
		usedPort = DEFAULT_PORT;
	}

	if (error) {
		return null;
	}

	parsedEnv = {
		port: usedPort,
		sessionSecret: envSessionSecret || '',
		connectionString: envConnectionString || '',
	};

	return parsedEnv;
}