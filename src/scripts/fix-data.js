
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const promotionSchema = new mongoose.Schema({
    code: String,
    isActive: Boolean,
    type: String,
    value: Number,
    startDate: Date,
    endDate: Date,
    usageLimit: Number,
    usedCount: Number
}, { strict: false });

const Promotion = mongoose.model('Promotion', promotionSchema);

async function fixData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // 1. Update Products Stock - Direct update to avoid schema validation/hooks issues
        console.log('Updating product stock directly...');
        const result = await mongoose.connection.collection('products').updateMany(
            { stock: { $lt: 50 } },  // Filter
            { $set: { stock: 100 } } // Update
        );
        console.log(`Matched ${result.matchedCount} and modified ${result.modifiedCount} products.`);


        // 2. Create/Update KOSHIRO20 Promotion
        console.log('Checking promotion KOSHIRO20...');
        const promoCode = 'KOSHIRO20';
        let promo = await Promotion.findOne({ code: promoCode });

        if (!promo) {
            console.log('Creating KOSHIRO20 promotion...');
            await Promotion.create({
                code: promoCode,
                name: 'Discount 20%',
                description: '20% off for testing',
                type: 'percentage',
                value: 20,
                isActive: true,
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                usageLimit: 1000,
                usedCount: 0,
                minOrderAmount: 0
            });
            console.log('KOSHIRO20 created!');
        } else {
            console.log('KOSHIRO20 exists, updating...');
            await Promotion.updateOne({ code: promoCode }, {
                $set: {
                    isActive: true,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    usedCount: 0,
                    minOrderAmount: 0
                }
            });
            console.log('KOSHIRO20 updated!');
        }

        console.log('Data fix complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixData();
