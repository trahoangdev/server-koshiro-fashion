import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Koshiro Fashion API',
            version: '1.0.0',
            description: 'API documentation for Koshiro Fashion e-commerce platform',
            contact: {
                name: 'Koshiro Fashion Support',
                email: 'support@koshirofashion.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api`,
                description: 'Development server',
            },
            {
                url: 'https://api.koshirofashion.com/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message description',
                        },
                        code: {
                            type: 'string',
                            example: 'ERROR_CODE',
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        name: { type: 'string', example: 'John Doe' },
                        role: { type: 'string', enum: ['Customer', 'Admin'], example: 'Customer' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                    },
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        name: { type: 'string', example: 'T-Shirt' },
                        price: { type: 'number', example: 29.99 },
                        categoryId: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                        stock: { type: 'integer', example: 100 },
                        isActive: { type: 'boolean', example: true },
                        images: { type: 'array', items: { type: 'string' } },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
                        userId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    productId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                                    quantity: { type: 'integer', example: 1 },
                                    price: { type: 'number', example: 29.99 },
                                },
                            },
                        },
                        totalAmount: { type: 'number', example: 29.99 },
                        status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], example: 'pending' },
                    },
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@example.com' },
                        password: { type: 'string', format: 'password', example: 'password123' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Login successful' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' },
                    },
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
