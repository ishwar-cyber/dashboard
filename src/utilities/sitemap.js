import { SitemapStream, streamToPromise } from 'sitemap';
import Product from '../modules/product.modules.js';
import Category from '../modules/category.modules.js';
import { BASE_URL } from '../../config/env.js';
export async function generateSitemap() {
    try {
        const smStream = new SitemapStream({
            hostname: BASE_URL || 'http://localhost:4400'
        });

        // Add static routes
        smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
        smStream.write({ url: '/products', changefreq: 'daily', priority: 0.8 });
        smStream.write({ url: '/categories', changefreq: 'weekly', priority: 0.7 });
        smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.5 });

        // Add dynamic product routes
        const products = await Product.find({ status: true }).select('slug updatedAt');
        products.forEach(product => {
            smStream.write({
                url: `/product/${product.slug}`,
                changefreq: 'weekly',
                priority: 0.8,
                lastmod: product.updatedAt
            });
        });

        // Add dynamic category routes
        const categories = await Category.find({ isActive: true }).select('slug updatedAt');
        categories.forEach(category => {
            smStream.write({
                url: `/category/${category.slug}`,
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: category.updatedAt
            });
        });

        smStream.end();
        return await streamToPromise(smStream);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        throw error;
    }
}