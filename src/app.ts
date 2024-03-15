import express, { Request, Response } from 'express';
import passport from 'passport';
import { cors } from './lib/cors.js';
import { router } from './routes/api.js';


const app = express();


app.use(express.json());

app.use(cors);
app.use(passport.initialize());
app.use(router);

const port = process.env.PORT || 3000;

app.use((_req: Request, res: Response) => {
	res.status(404).json({ error: 'not found' });
});

app.use((err: Error, _req: Request, res: Response) => {
	console.log('test')
	if (
		err instanceof SyntaxError &&
		'status' in err &&
		err.status === 400 &&
		'body' in err
	) {
		return res.status(400).json({ error: 'invalid json' });
	}
	return res
		.status(500)
		.json({ error: err.message ?? 'internal server error' });
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}/`);
});