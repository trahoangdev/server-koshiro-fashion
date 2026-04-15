
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { Category } from '../models/Category';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

const generateSlug = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Build-in string normalization
        .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
        .replace(/[^a-z0-9 -]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove consecutive hyphens
};

const migrateSlugs = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Migrate Products
        console.log('🔄 Migrating Product slugs...');
        const products = await Product.find({});
        let productCount = 0;

        for (const product of products) {
            if (!product.slug || product.slug.trim() === '') {
                const baseSlug = generateSlug(product.nameEn || product.name);

                // Ensure uniqueness (simple check)
                let slug = baseSlug;
                let counter = 1;
                while (await Product.findOne({ slug, _id: { $ne: product._id } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }

                product.slug = slug;
                await product.save();
                console.log(`   Updated product: ${product.name} -> ${slug}`);
                productCount++;
            }
        }
        console.log(`✅ Updated ${productCount} products`);

        // 2. Migrate Categories
        console.log('🔄 Migrating Category slugs...');
        const categories = await Category.find({});
        let categoryCount = 0;

        for (const category of categories) {
            // Categories usually have slugs, but let's check
            if (!category.slug || category.slug.trim() === '') {
                const baseSlug = generateSlug(category.nameEn || category.name);

                let slug = baseSlug;
                let counter = 1;
                while (await Category.findOne({ slug, _id: { $ne: category._id } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }

                category.slug = slug;
                await category.save();
                console.log(`   Updated category: ${category.name} -> ${slug}`);
                categoryCount++;
            }
        }
        console.log(`✅ Updated ${categoryCount} categories`);

        console.log('🎉 Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateSlugs();
