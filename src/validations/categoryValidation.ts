import { z } from 'zod';

const categorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        nameEn: z.string().optional(),
        nameJa: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionJa: z.string().optional(),
        slug: z.string().min(1, 'Slug is required')
            .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
        image: z.string().optional(),
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
        bannerImage: z.string().optional(),
        cloudinaryBannerImages: z.array(z.any()).optional(),
        isActive: z.boolean().optional(),
        parentId: z.string().optional(), // Checking for 24 chars can be done in DB logic or refined regex
        status: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isFeatured: z.boolean().optional(),
        isVisible: z.boolean().optional(),
        displayType: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        seoUrl: z.string().optional(),
        canonicalUrl: z.string().optional(),
        schemaMarkup: z.string().optional()
    })
});

export const createCategorySchema = categorySchema;

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Category ID is required')
    }),
    body: categorySchema.shape.body.partial()
});
