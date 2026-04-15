import { Request, Response } from 'express';
import { createOrder } from '../../controllers/orderController';
import { Product } from '../../models/Product';
import { Order, generateOrderNumber } from '../../models/Order';
import { User } from '../../models/User';
import Promotion from '../../models/Promotion';

// Mock dependencies
jest.mock('../../models/Product');
jest.mock('../../models/Order', () => {
    return {
        Order: jest.fn(),
        generateOrderNumber: jest.fn()
    };
});
jest.mock('../../models/User');
jest.mock('../../models/Promotion');

describe('OrderController - createOrder', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        mockReq = {
            body: {
                items: [
                    { productId: 'prod1', quantity: 1, size: 'M', color: 'Red' }
                ],
                shippingAddress: {
                    fullName: 'Test User',
                    phone: '1234567890',
                    address: '123 Test St',
                    city: 'Test City',
                    district: 'Test District',
                    ward: 'Test Ward'
                },
                paymentMethod: 'COD'
            },
            user: {
                id: 'user1',
                email: 'test@example.com',
                role: 'Customer',
                name: 'Test'
            }
        } as any;

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

        (generateOrderNumber as jest.Mock).mockResolvedValue('ORD-12345');
        (Promotion.findOne as jest.Mock).mockResolvedValue(null);
        (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    });

    it('should create an order successfully', async () => {
        // Mock Product.findById
        const mockProduct = {
            _id: 'prod1',
            name: 'Test Product',
            price: 100,
            stock: 10,
            isActive: true,
            save: jest.fn()
        };
        (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
        (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProduct);

        // Mock Order implementation
        const mockOrderInstance = {
            save: jest.fn().mockResolvedValue({
                _id: 'order1',
                orderNumber: 'ORD-12345'
            })
        };
        (Order as unknown as jest.Mock).mockImplementation(() => mockOrderInstance);

        await createOrder(mockReq as Request, mockRes as Response, next);

        if (next.mock.calls.length > 0) {
            throw next.mock.calls[0][0];
        }
        expect(Product.findById).toHaveBeenCalledWith('prod1');
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 400 if product not found', async () => {
        (Product.findById as jest.Mock).mockResolvedValue(null);

        await createOrder(mockReq as Request, mockRes as Response, next);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not found') }));
    });

    it('should return 400 if stock is insufficient', async () => {
        const mockProduct = {
            _id: 'prod1',
            name: 'Test Product',
            price: 100,
            stock: 0,
            isActive: true
        };
        (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

        await createOrder(mockReq as Request, mockRes as Response, next);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Insufficient stock') }));
    });
});
