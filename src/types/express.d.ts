import { Express } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: string | { name: string; _id: string };
                permissions?: string[];
            };
        }
    }
}

export { };
