import { z } from 'zod';

const productSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        nameEn: z.string().optional(),
        nameJa: z.string().optional(),
        description: z.string().min(1, 'Description is required'),
        descriptionEn: z.string().optional(),
        descriptionJa: z.string().optional(),
        price: z.number().positive('Price must be positive'),
        originalPrice: z.number().positive('Original price must be positive').optional(),
        categoryId: z.string().min(1, 'Category is required'),
        images: z.array(z.string()).optional(), // Legacy images
        cloudinaryImages: z.array(z.object({
            publicId: z.string(),
            secureUrl: z.string(),
            width: z.number(),
            height: z.number(),
            format: z.string(),
            bytes: z.number(),
            responsiveUrls: z.object({
                thumbnail: z.string(),
                medium: z.string(),
                large: z.string(),
                original: z.string()
            }).optional()
        })).optional(),
        sizes: z.array(z.string()).optional(),
        colors: z.array(z.string()).optional(),
        stock: z.number().int().nonnegative('Stock must be non-negative').default(0),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        slug: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        weight: z.number().positive().optional(),
        dimensions: z.object({
            length: z.number().positive(),
            width: z.number().positive(),
            height: z.number().positive(),
            unit: z.enum(['cm', 'in']).default('cm')
        }).optional(),
        materials: z.array(z.string()).optional(),
        careInstructions: z.string().optional(),
        careInstructionsEn: z.string().optional(),
        careInstructionsJa: z.string().optional(),
        origin: z.string().optional(),
        originEn: z.string().optional(),
        originJa: z.string().optional(),
        isNew: z.boolean().optional(),
        isLimitedEdition: z.boolean().optional(),
        isBestSeller: z.boolean().optional(),
        onSale: z.boolean().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional()
    })
});

export const createProductSchema = productSchema;

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Product ID is required')
    }),
    body: productSchema.shape.body.partial()
});
