import { NextFunction, Request, Response } from "express";

/**
 * Middleware that renders 404 page.
 */
export function handler404(req: Request, res: Response) {
	const title = "Síða fannst ekki";
	return res.status(404).render("error", { title });
}

/**
 * Middleware that logs error and renders error page.
 */
export function handlerError(err: Error, req: Request, res: Response, next: NextFunction) {
	console.error("error occured", err, next);
	const templateData = { title: "Villa kom upp" };

	return res.status(500).render("error", templateData);
}
