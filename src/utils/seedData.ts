import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

// Helper function to generate Vietnamese, English, and Japanese product names
const generateProductData = (baseName: { vi: string; en: string; ja: string }, baseDescription: { vi: string; en: string; ja: string }) => ({
  name: baseName.vi,
  nameEn: baseName.en,
  nameJa: baseName.ja,
  description: baseDescription.vi,
  descriptionEn: baseDescription.en,
  descriptionJa: baseDescription.ja
});

// Enhanced color translations
const colorTranslations = {
  'Đen': { en: 'Black', ja: '黒' },
  'Trắng': { en: 'White', ja: '白' },
  'Đỏ': { en: 'Red', ja: '赤' },
  'Xanh dương': { en: 'Blue', ja: '青' },
  'Xanh lá': { en: 'Green', ja: '緑' },
  'Hồng': { en: 'Pink', ja: 'ピンク' },
  'Tím': { en: 'Purple', ja: '紫' },
  'Vàng': { en: 'Yellow', ja: '黄色' },
  'Nâu': { en: 'Brown', ja: '茶色' },
  'Xám': { en: 'Gray', ja: 'グレー' },
  'Xanh đen': { en: 'Navy', ja: 'ネイビー' },
  'Tím đen': { en: 'Dark Purple', ja: 'ダークパープル' },
  'Cam': { en: 'Orange', ja: 'オレンジ' },
  'Kem': { en: 'Cream', ja: 'クリーム' },
  'Bạc': { en: 'Silver', ja: 'シルバー' },
  'Vàng kim': { en: 'Gold', ja: 'ゴールド' }
};

// Enhanced size translations
const sizeTranslations = {
  'XS': { en: 'XS', ja: 'XS' },
  'S': { en: 'S', ja: 'S' },
  'M': { en: 'M', ja: 'M' },
  'L': { en: 'L', ja: 'L' },
  'XL': { en: 'XL', ja: 'XL' },
  'XXL': { en: 'XXL', ja: 'XXL' },
  'One Size': { en: 'One Size', ja: 'フリーサイズ' }
};

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting to seed data...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@koshiro.com',
      password: 'admin123',
      name: 'Admin Koshiro',
      role: 'admin',
      status: 'active',
      addresses: [
        {
          street: '123 Shibuya Street',
          city: 'Tokyo',
          state: 'Tokyo',
          zipCode: '150-0002',
          country: 'Japan',
          isDefault: true
        }
      ],
      preferences: {
        language: 'ja',
        currency: 'JPY',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    });
    await adminUser.save();
    console.log('👤 Created admin user');

    // Create test customer users
    const customers = [
      {
        email: 'customer1@example.com',
        password: 'customer123',
        name: 'Nguyen Van A',
        role: 'customer',
        status: 'active',
        addresses: [
          {
            street: '456 Le Loi Street',
            city: 'Ho Chi Minh City',
            state: 'Ho Chi Minh',
            zipCode: '700000',
            country: 'Vietnam',
            isDefault: true
          }
        ],
        preferences: {
          language: 'vi',
          currency: 'VND',
          notifications: {
            email: true,
            sms: true,
            push: true
          }
        }
      },
      {
        email: 'customer2@example.com',
        password: 'customer123',
        name: 'John Smith',
        role: 'customer',
        status: 'active',
        addresses: [
          {
            street: '789 Broadway',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
            isDefault: true
          }
        ],
        preferences: {
          language: 'en',
          currency: 'USD',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      },
      {
        email: 'customer3@example.com',
        password: 'customer123',
        name: 'Tanaka Hiroshi',
        role: 'customer',
        status: 'active',
        addresses: [
          {
            street: '321 Sakura Street',
            city: 'Osaka',
            state: 'Osaka',
            zipCode: '540-0001',
            country: 'Japan',
            isDefault: true
          }
        ],
        preferences: {
          language: 'ja',
          currency: 'JPY',
          notifications: {
            email: true,
            sms: true,
            push: false
          }
        }
      }
    ];

    await User.insertMany(customers);
    console.log('👥 Created customer users');

    // Create enhanced categories
    const categories = [
      {
        name: 'Áo',
        nameEn: 'Tops',
        nameJa: 'トップス',
        description: 'Bộ sưu tập các loại áo thời trang Nhật Bản cao cấp với chất liệu tự nhiên và thiết kế tinh tế',
        descriptionEn: 'Premium Japanese fashion tops collection with natural materials and refined designs',
        descriptionJa: '自然素材と洗練されたデザインによる日本のプレミアムファッショントップスコレクション',
        slug: 'tops',
        image: '/images/categories/haori.png',
        isActive: true,
        sortOrder: 1,
        metaTitle: 'Áo Thời Trang Nhật Bản | Koshiro Fashion',
        metaDescription: 'Khám phá bộ sưu tập áo thời trang Nhật Bản cao cấp với thiết kế độc đáo và chất liệu tự nhiên'
      },
      {
        name: 'Quần',
        nameEn: 'Bottoms',
        nameJa: 'ボトムス',
        description: 'Bộ sưu tập quần và váy thời trang Nhật Bản với phom dáng hoàn hảo và comfort tối ưu',
        descriptionEn: 'Japanese fashion bottoms collection with perfect fit and optimal comfort',
        descriptionJa: '完璧なフィットと最適な快適さを備えた日本のファッションボトムスコレクション',
        slug: 'bottoms',
        image: '/images/categories/quan.png',
        isActive: true,
        sortOrder: 2,
        metaTitle: 'Quần Thời Trang Nhật Bản | Koshiro Fashion',
        metaDescription: 'Tuyển chọn quần thời trang Nhật Bản với phom dáng hoàn hảo và chất liệu cao cấp'
      },
      {
        name: 'Phụ kiện',
        nameEn: 'Accessories',
        nameJa: 'アクセサリー',
        description: 'Phụ kiện thời trang Nhật Bản tinh tế - từ túi xách, giày dép đến trang sức truyền thống',
        descriptionEn: 'Exquisite Japanese fashion accessories - from bags, footwear to traditional jewelry',
        descriptionJa: 'バッグ、履物から伝統的なジュエリーまで、精巧な日本のファッションアクセサリー',
        slug: 'accessories',
        image: '/images/categories/phukien.png',
        isActive: true,
        sortOrder: 3,
        metaTitle: 'Phụ Kiện Thời Trang Nhật Bản | Koshiro Fashion',
        metaDescription: 'Bộ sưu tập phụ kiện thời trang Nhật Bản cao cấp với thiết kế độc đáo và chất lượng vượt trội'
      },
      {
        name: 'Kimono',
        nameEn: 'Kimono',
        nameJa: '着物',
        description: 'Kimono truyền thống Nhật Bản authentic với nghệ thuật thêu tay và họa tiết độc quyền',
        descriptionEn: 'Authentic traditional Japanese kimono with hand-embroidered artistry and exclusive patterns',
        descriptionJa: '手刺繍の芸術性と独占的なパターンを持つ本格的な伝統的日本の着物',
        slug: 'kimono',
        image: '/images/categories/kimono.png',
        isActive: true,
        sortOrder: 4,
        metaTitle: 'Kimono Truyền Thống Nhật Bản | Koshiro Fashion',
        metaDescription: 'Kimono authentic với nghệ thuật thêu tay tinh xảo và họa tiết độc quyền từ Nhật Bản'
      },
      {
        name: 'Yukata',
        nameEn: 'Yukata',
        nameJa: '浴衣',
        description: 'Yukata mùa hè nhẹ nhàng với họa tiết hoa anh đào và thiết kế thoải mái cho mọi dịp',
        descriptionEn: 'Light summer yukata with cherry blossom patterns and comfortable designs for all occasions',
        descriptionJa: 'あらゆる機会に適した桜の模様と快適なデザインの軽い夏の浴衣',
        slug: 'yukata',
        image: '/images/categories/kimono.png',
        isActive: true,
        sortOrder: 5,
        metaTitle: 'Yukata Mùa Hè Nhật Bản | Koshiro Fashion',
        metaDescription: 'Yukata mùa hè với họa tiết hoa anh đào đẹp mắt và chất liệu cotton thoáng mát'
      },
      {
        name: 'Hakama',
        nameEn: 'Hakama',
        nameJa: '袴',
        description: 'Hakama truyền thống cho các dịp trang trọng với chất liệu silk cao cấp và may thủ công',
        descriptionEn: 'Traditional hakama for formal occasions with premium silk materials and handcrafted construction',
        descriptionJa: 'プレミアムシルク素材と手作りの構造による正式な機会のための伝統的な袴',
        slug: 'hakama',
        image: '/images/categories/hakama.png',
        isActive: true,
        sortOrder: 6,
        metaTitle: 'Hakama Truyền Thống Nhật Bản | Koshiro Fashion',
        metaDescription: 'Hakama cao cấp với chất liệu silk và may thủ công cho các dịp trang trọng'
      },
      {
        name: 'Haori',
        nameEn: 'Haori',
        nameJa: '羽織',
        description: 'Áo khoác Haori elegant với lớp lót silk và chi tiết thêu tinh xảo',
        descriptionEn: 'Elegant haori jackets with silk lining and exquisite embroidered details',
        descriptionJa: 'シルクの裏地と精巧な刺繍の詳細を備えたエレガントな羽織ジャケット',
        slug: 'haori',
        image: '/images/categories/haori.png',
        isActive: true,
        sortOrder: 7,
        metaTitle: 'Áo Khoác Haori Nhật Bản | Koshiro Fashion',
        metaDescription: 'Áo khoác Haori elegant với lót silk và chi tiết thêu thủ công tinh xảo'
      },
      {
        name: 'Obi & Đai',
        nameEn: 'Obi & Belts',
        nameJa: '帯・ベルト',
        description: 'Bộ sưu tập obi và đai thắt lưng truyền thống với nghệ thuật dệt thổ cẩm',
        descriptionEn: 'Traditional obi and belt collection with brocade weaving artistry',
        descriptionJa: '錦織りの芸術性を備えた伝統的な帯とベルトのコレクション',
        slug: 'obi-belts',
        image: '/images/categories/obi.png',
        isActive: true,
        sortOrder: 8,
        metaTitle: 'Obi và Đai Thắt Lưng Nhật Bản | Koshiro Fashion',
        metaDescription: 'Obi và đai thắt lưng truyền thống với nghệ thuật dệt thổ cẩm tinh xảo'
      }
    ];

    const savedCategories = await Category.insertMany(categories);
    console.log('📂 Created categories');

    // Create enhanced products for each category
    const products = [
      // ===== TOPS (Áo) - 10 sản phẩm =====
      {
        ...generateProductData(
          { vi: 'Áo Yukata Nam Premium', en: 'Premium Men Yukata Top', ja: 'プレミアム男性用浴衣トップ' },
          { vi: 'Áo Yukata cao cấp dành cho nam giới với họa tiết rồng truyền thống và chất liệu cotton organic', en: 'Premium yukata top for men with traditional dragon patterns and organic cotton material', ja: '伝統的な龍の模様とオーガニックコットン素材のプレミアム男性用浴衣トップ' }
        ),
        price: 450000,
        salePrice: 350000,
        originalPrice: 450000,
        categoryId: savedCategories[0]._id, // Tops
        images: ['/images/products/yukata-men-dragon.jpg', '/images/products/yukata-men-dragon-2.jpg', '/images/products/yukata-men-dragon-3.jpg'],
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Xanh dương', 'Đen', 'Xám'],
        colorsEn: ['Blue', 'Black', 'Gray'],
        colorsJa: ['青', '黒', 'グレー'],
        stock: 25,
        isActive: true,
        isFeatured: true,
        tags: ['yukata', 'nam', 'áo', 'truyền thống', 'cotton organic', 'rồng'],
        sku: 'YKT-M-DRG-001',
        weight: 0.3,
        material: 'Cotton Organic',
        careInstructions: 'Giặt tay với nước lạnh, phơi khô tự nhiên',
        origin: 'Japan',
        warranty: '6 tháng',
        rating: 4.8,
        reviewCount: 45
      },
      {
        name: 'Áo Kimono Nữ',
        nameEn: 'Women Kimono Top',
        nameJa: '女性用着物トップ',
        description: 'Áo Kimono dành cho nữ với họa tiết hoa anh đào',
        descriptionEn: 'Kimono top for women with cherry blossom pattern',
        descriptionJa: '桜の模様の女性用着物トップ',
        price: 550000,
        originalPrice: 700000,
        categoryId: savedCategories[0]._id, // Tops
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Hồng', 'Trắng', 'Xanh lá'],
        stock: 15,
        isActive: true,
        isFeatured: true,
        tags: ['kimono', 'nữ', 'áo', 'hoa anh đào']
      },
      {
        name: 'Áo Haori',
        nameEn: 'Haori Jacket',
        nameJa: '羽織',
        description: 'Áo khoác Haori truyền thống Nhật Bản',
        descriptionEn: 'Traditional Japanese haori jacket',
        descriptionJa: '伝統的な日本の羽織',
        price: 280000,
        originalPrice: 350000,
        categoryId: savedCategories[0]._id, // Tops
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Đen', 'Xanh đen', 'Nâu'],
        stock: 10,
        isActive: true,
        isFeatured: false,
        tags: ['haori', 'áo khoác', 'truyền thống']
      },
      {
        name: 'Áo Happi',
        nameEn: 'Happi Coat',
        nameJa: '法被',
        description: 'Áo Happi truyền thống cho lễ hội',
        descriptionEn: 'Traditional happi coat for festivals',
        descriptionJa: '祭りのための伝統的な法被',
        price: 180000,
        originalPrice: 220000,
        categoryId: savedCategories[0]._id, // Tops
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Đỏ', 'Xanh dương', 'Trắng'],
        stock: 20,
        isActive: true,
        isFeatured: false,
        tags: ['happi', 'lễ hội', 'áo']
      },
      {
        name: 'Áo Jinbei',
        nameEn: 'Jinbei Top',
        nameJa: '甚平トップ',
        description: 'Áo Jinbei mùa hè thoải mái',
        descriptionEn: 'Comfortable summer jinbei top',
        descriptionJa: '快適な夏の甚平トップ',
        price: 120000,
        originalPrice: 150000,
        categoryId: savedCategories[0]._id, // Tops
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Xanh lá', 'Xanh dương', 'Trắng'],
        stock: 25,
        isActive: true,
        isFeatured: false,
        tags: ['jinbei', 'mùa hè', 'áo']

      },

      // ===== BOTTOMS (Quần) =====
      {
        name: 'Quần Hakama',
        nameEn: 'Hakama Pants',
        nameJa: '袴パンツ',
        description: 'Quần Hakama truyền thống cho nam',
        descriptionEn: 'Traditional hakama pants for men',
        descriptionJa: '男性用の伝統的な袴パンツ',
        price: 800000,
        originalPrice: 1000000,
        categoryId: savedCategories[1]._id, // Bottoms
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Đen', 'Xanh đen'],
        stock: 8,
        isActive: true,
        isFeatured: true,
        tags: ['hakama', 'nam', 'truyền thống']
      },
      {
        name: 'Quần Yukata Nữ',
        nameEn: 'Women Yukata Pants',
        nameJa: '女性用浴衣パンツ',
        description: 'Quần Yukata dành cho nữ với họa tiết hoa cúc',
        descriptionEn: 'Yukata pants for women with chrysanthemum pattern',
        descriptionJa: '菊の模様の女性用浴衣パンツ',
        price: 320000,
        originalPrice: 400000,
        categoryId: savedCategories[1]._id, // Bottoms
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Xanh lá', 'Hồng', 'Trắng'],
        stock: 18,
        isActive: true,
        isFeatured: false,
        tags: ['yukata', 'nữ', 'quần', 'hoa cúc']
      },
      {
        name: 'Quần Jinbei',
        nameEn: 'Jinbei Pants',
        nameJa: '甚平パンツ',
        description: 'Quần Jinbei mùa hè thoải mái',
        descriptionEn: 'Comfortable summer jinbei pants',
        descriptionJa: '快適な夏の甚平パンツ',
        price: 100000,
        originalPrice: 120000,
        categoryId: savedCategories[1]._id, // Bottoms
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Xanh lá', 'Xanh dương', 'Trắng'],
        stock: 30,
        isActive: true,
        isFeatured: false,
        tags: ['jinbei', 'mùa hè', 'quần']
      },
      {
        name: 'Quần Fundoshi',
        nameEn: 'Fundoshi',
        nameJa: '褌',
        description: 'Quần Fundoshi truyền thống',
        descriptionEn: 'Traditional fundoshi',
        descriptionJa: '伝統的な褌',
        price: 80000,
        originalPrice: 100000,
        categoryId: savedCategories[1]._id, // Bottoms
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Trắng', 'Xanh dương'],
        stock: 15,
        isActive: true,
        isFeatured: false,
        tags: ['fundoshi', 'truyền thống', 'quần']
      },
      {
        name: 'Quần Momohiki',
        nameEn: 'Momohiki Pants',
        nameJa: '股引パンツ',
        description: 'Quần Momohiki ấm áp mùa đông',
        descriptionEn: 'Warm winter momohiki pants',
        descriptionJa: '暖かい冬の股引パンツ',
        price: 150000,
        originalPrice: 180000,
        categoryId: savedCategories[1]._id, // Bottoms
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Đen', 'Xám', 'Nâu'],
        stock: 12,
        isActive: true,
        isFeatured: false,
        tags: ['momohiki', 'mùa đông', 'quần']

      },

      // ===== ACCESSORIES (Phụ kiện) =====
      {
        name: 'Dép Geta',
        nameEn: 'Geta Sandals',
        nameJa: '下駄',
        description: 'Dép Geta truyền thống Nhật Bản',
        descriptionEn: 'Traditional Japanese geta sandals',
        descriptionJa: '伝統的な日本の下駄',
        price: 50000,
        originalPrice: 75000,
        categoryId: savedCategories[2]._id, // Accessories
        images: ['/placeholder.svg'],
        sizes: ['36', '37', '38', '39', '40', '41', '42'],
        colors: ['Nâu', 'Đen'],
        stock: 25,
        isActive: true,
        isFeatured: false,
        tags: ['geta', 'dép', 'truyền thống']
      },
      {
        name: 'Thắt Lưng Obi',
        nameEn: 'Obi Belt',
        nameJa: '帯',
        description: 'Thắt lưng Obi cho kimono',
        descriptionEn: 'Obi belt for kimono',
        descriptionJa: '着物用の帯',
        price: 100000,
        originalPrice: 150000,
        categoryId: savedCategories[2]._id, // Accessories
        images: ['/placeholder.svg'],
        sizes: ['One Size'],
        colors: ['Đỏ', 'Vàng', 'Xanh dương'],
        stock: 20,
        isActive: true,
        isFeatured: false,
        tags: ['obi', 'thắt lưng', 'kimono']
      },
      {
        name: 'Túi Kinchaku',
        nameEn: 'Kinchaku Bag',
        nameJa: '巾着',
        description: 'Túi Kinchaku truyền thống',
        descriptionEn: 'Traditional kinchaku bag',
        descriptionJa: '伝統的な巾着',
        price: 80000,
        originalPrice: 100000,
        categoryId: savedCategories[2]._id, // Accessories
        images: ['/placeholder.svg'],
        sizes: ['One Size'],
        colors: ['Đỏ', 'Xanh dương', 'Hồng'],
        stock: 15,
        isActive: true,
        isFeatured: false,
        tags: ['kinchaku', 'túi', 'truyền thống']
      },
      {
        name: 'Quạt Sensu',
        nameEn: 'Sensu Fan',
        nameJa: '扇子',
        description: 'Quạt Sensu truyền thống Nhật Bản',
        descriptionEn: 'Traditional Japanese sensu fan',
        descriptionJa: '伝統的な日本の扇子',
        price: 30000,
        originalPrice: 45000,
        categoryId: savedCategories[2]._id, // Accessories
        images: ['/placeholder.svg'],
        sizes: ['One Size'],
        colors: ['Trắng', 'Đen', 'Hồng'],
        stock: 40,
        isActive: true,
        isFeatured: false,
        tags: ['sensu', 'quạt', 'truyền thống']
      },
      {
        name: 'Vớ Tabi',
        nameEn: 'Tabi Socks',
        nameJa: '足袋',
        description: 'Vớ Tabi truyền thống Nhật Bản',
        descriptionEn: 'Traditional Japanese tabi socks',
        descriptionJa: '伝統的な日本の足袋',
        price: 25000,
        originalPrice: 35000,
        categoryId: savedCategories[2]._id, // Accessories
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Trắng', 'Đen', 'Xanh dương'],
        stock: 35,
        isActive: true,
        isFeatured: false,
        tags: ['tabi', 'vớ', 'truyền thống']

      },

      // ===== KIMONO =====
      {
        name: 'Kimono Truyền Thống',
        nameEn: 'Traditional Kimono',
        nameJa: '伝統的な着物',
        description: 'Kimono truyền thống Nhật Bản với họa tiết hoa anh đào',
        descriptionEn: 'Traditional Japanese kimono with cherry blossom pattern',
        descriptionJa: '桜の模様の伝統的な日本の着物',
        price: 1200000,
        originalPrice: 1500000,
        categoryId: savedCategories[3]._id, // Kimono
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Đỏ', 'Xanh dương', 'Đen'],
        stock: 10,
        isActive: true,
        isFeatured: true,
        tags: ['kimono', 'truyền thống', 'hoa anh đào']
      },
      {
        name: 'Kimono Furisode',
        nameEn: 'Furisode Kimono',
        nameJa: '振袖着物',
        description: 'Kimono Furisode dành cho nữ trẻ',
        descriptionEn: 'Furisode kimono for young women',
        descriptionJa: '若い女性用の振袖着物',
        price: 1800000,
        originalPrice: 2200000,
        categoryId: savedCategories[3]._id, // Kimono
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Hồng', 'Tím', 'Vàng'],
        stock: 5,
        isActive: true,
        isFeatured: true,
        tags: ['furisode', 'kimono', 'nữ trẻ']
      },
      {
        name: 'Kimono Tomesode',
        nameEn: 'Tomesode Kimono',
        nameJa: '留袖着物',
        description: 'Kimono Tomesode dành cho phụ nữ đã kết hôn',
        descriptionEn: 'Tomesode kimono for married women',
        descriptionJa: '既婚女性用の留袖着物',
        price: 1500000,
        originalPrice: 1800000,
        categoryId: savedCategories[3]._id, // Kimono
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Đen', 'Xanh đen', 'Tím đen'],
        stock: 8,
        isActive: true,
        isFeatured: false,
        tags: ['tomesode', 'kimono', 'đã kết hôn']
      },
      {
        name: 'Kimono Houmongi',
        nameEn: 'Houmongi Kimono',
        nameJa: '訪問着着物',
        description: 'Kimono Houmongi dành cho các dịp trang trọng',
        descriptionEn: 'Houmongi kimono for formal occasions',
        descriptionJa: '正式な場所用の訪問着着物',
        price: 1400000,
        originalPrice: 1700000,
        categoryId: savedCategories[3]._id, // Kimono
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Xanh dương', 'Xanh lá', 'Tím'],
        stock: 6,
        isActive: true,
        isFeatured: false,
        tags: ['houmongi', 'kimono', 'trang trọng']
      },
      {
        name: 'Kimono Komon',
        nameEn: 'Komon Kimono',
        nameJa: '小紋着物',
        description: 'Kimono Komon với họa tiết nhỏ cho mặc hàng ngày',
        descriptionEn: 'Komon kimono with small patterns for daily wear',
        descriptionJa: '日常着用の小模様の小紋着物',
        price: 800000,
        originalPrice: 1000000,
        categoryId: savedCategories[3]._id, // Kimono
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Xanh lá', 'Hồng', 'Vàng'],
        stock: 12,
        isActive: true,
        isFeatured: false,
        tags: ['komon', 'kimono', 'hàng ngày']

      },

      // ===== YUKATA =====
      {
        name: 'Yukata Mùa Hè',
        nameEn: 'Summer Yukata',
        nameJa: '夏の浴衣',
        description: 'Yukata mùa hè với họa tiết hoa cúc',
        descriptionEn: 'Summer yukata with chrysanthemum pattern',
        descriptionJa: '菊の模様の夏の浴衣',
        price: 445000,
        originalPrice: 550000,
        categoryId: savedCategories[4]._id, // Yukata
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Xanh lá', 'Hồng', 'Trắng'],
        stock: 15,
        isActive: true,
        isFeatured: true,
        tags: ['yukata', 'mùa hè', 'hoa cúc']
      },
      {
        name: 'Yukata Nam',
        nameEn: 'Men Yukata',
        nameJa: '男性用浴衣',
        description: 'Yukata dành cho nam giới với họa tiết đơn giản',
        descriptionEn: 'Yukata for men with simple patterns',
        descriptionJa: 'シンプルな模様の男性用浴衣',
        price: 380000,
        originalPrice: 480000,
        categoryId: savedCategories[4]._id, // Yukata
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Xanh dương', 'Đen', 'Xám'],
        stock: 18,
        isActive: true,
        isFeatured: false,
        tags: ['yukata', 'nam', 'đơn giản']
      },
      {
        name: 'Yukata Nữ',
        nameEn: 'Women Yukata',
        nameJa: '女性用浴衣',
        description: 'Yukata dành cho nữ với họa tiết hoa anh đào',
        descriptionEn: 'Yukata for women with cherry blossom pattern',
        descriptionJa: '桜の模様の女性用浴衣',
        price: 420000,
        originalPrice: 520000,
        categoryId: savedCategories[4]._id, // Yukata
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Hồng', 'Tím', 'Trắng'],
        stock: 20,
        isActive: true,
        isFeatured: false,
        tags: ['yukata', 'nữ', 'hoa anh đào']
      },
      {
        name: 'Yukata Trẻ Em',
        nameEn: 'Children Yukata',
        nameJa: '子供用浴衣',
        description: 'Yukata dành cho trẻ em với họa tiết dễ thương',
        descriptionEn: 'Yukata for children with cute patterns',
        descriptionJa: 'かわいい模様の子供用浴衣',
        price: 280000,
        originalPrice: 350000,
        categoryId: savedCategories[4]._id, // Yukata
        images: ['/placeholder.svg'],
        sizes: ['XS', 'S', 'M'],
        colors: ['Xanh lá', 'Hồng', 'Vàng'],
        stock: 25,
        isActive: true,
        isFeatured: false,
        tags: ['yukata', 'trẻ em', 'dễ thương']
      },
      {
        name: 'Yukata Lễ Hội',
        nameEn: 'Festival Yukata',
        nameJa: '祭り浴衣',
        description: 'Yukata đặc biệt cho các lễ hội mùa hè',
        descriptionEn: 'Special yukata for summer festivals',
        descriptionJa: '夏祭り用の特別な浴衣',
        price: 500000,
        originalPrice: 620000,
        categoryId: savedCategories[4]._id, // Yukata
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Đỏ', 'Xanh dương', 'Vàng'],
        stock: 10,
        isActive: true,
        isFeatured: true,
        tags: ['yukata', 'lễ hội', 'mùa hè']

      },

      // ===== HAKAMA =====
      {
        name: 'Hakama Nam',
        nameEn: 'Men Hakama',
        nameJa: '男性用袴',
        description: 'Hakama truyền thống dành cho nam giới',
        descriptionEn: 'Traditional hakama for men',
        descriptionJa: '男性用の伝統的な袴',
        price: 800000,
        originalPrice: 1000000,
        categoryId: savedCategories[5]._id, // Hakama
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Đen', 'Xanh đen'],
        stock: 8,
        isActive: true,
        isFeatured: true,
        tags: ['hakama', 'nam', 'truyền thống']
      },
      {
        name: 'Hakama Nữ',
        nameEn: 'Women Hakama',
        nameJa: '女性用袴',
        description: 'Hakama dành cho nữ với thiết kế thanh lịch',
        descriptionEn: 'Hakama for women with elegant design',
        descriptionJa: 'エレガントなデザインの女性用袴',
        price: 750000,
        originalPrice: 950000,
        categoryId: savedCategories[5]._id, // Hakama
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Đen', 'Xanh đen', 'Tím đen'],
        stock: 10,
        isActive: true,
        isFeatured: false,
        tags: ['hakama', 'nữ', 'thanh lịch']
      },
      {
        name: 'Hakama Học Sinh',
        nameEn: 'Student Hakama',
        nameJa: '学生用袴',
        description: 'Hakama dành cho học sinh với thiết kế đơn giản',
        descriptionEn: 'Hakama for students with simple design',
        descriptionJa: 'シンプルなデザインの学生用袴',
        price: 600000,
        originalPrice: 750000,
        categoryId: savedCategories[5]._id, // Hakama
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L'],
        colors: ['Đen', 'Xanh đen'],
        stock: 15,
        isActive: true,
        isFeatured: false,
        tags: ['hakama', 'học sinh', 'đơn giản']
      },
      {
        name: 'Hakama Võ Sĩ',
        nameEn: 'Martial Artist Hakama',
        nameJa: '武道家用袴',
        description: 'Hakama dành cho võ sĩ với chất liệu bền bỉ',
        descriptionEn: 'Hakama for martial artists with durable material',
        descriptionJa: '耐久性のある素材の武道家用袴',
        price: 900000,
        originalPrice: 1100000,
        categoryId: savedCategories[5]._id, // Hakama
        images: ['/placeholder.svg'],
        sizes: ['M', 'L', 'XL'],
        colors: ['Đen', 'Xanh đen'],
        stock: 6,
        isActive: true,
        isFeatured: false,
        tags: ['hakama', 'võ sĩ', 'bền bỉ']
      },
      {
        name: 'Hakama Lễ Hội',
        nameEn: 'Festival Hakama',
        nameJa: '祭り袴',
        description: 'Hakama đặc biệt cho các lễ hội truyền thống',
        descriptionEn: 'Special hakama for traditional festivals',
        descriptionJa: '伝統的な祭り用の特別な袴',
        price: 850000,
        originalPrice: 1050000,
        categoryId: savedCategories[5]._id, // Hakama
        images: ['/placeholder.svg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Đen', 'Xanh đen', 'Tím đen'],
        stock: 8,
        isActive: true,
        isFeatured: false,
        tags: ['hakama', 'lễ hội', 'truyền thống']
      }
    ];

    await Product.insertMany(products);
    console.log('👕 Created products');

    // Update category product counts
    for (const category of savedCategories) {
      const count = await Product.countDocuments({ categoryId: category._id });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
    }
    console.log('📊 Updated category product counts');

    console.log('✅ Data seeding completed successfully!');
    console.log('🔑 Admin credentials: admin@koshiro.com / admin123');
    console.log('📦 Total products created: ' + products.length);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await disconnectDB();
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

export default seedData; 