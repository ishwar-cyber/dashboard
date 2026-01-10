import { SitemapStream, streamToPromise } from 'sitemap';
import prisma from '../config/prisma.js';
import { BASE_URL } from '../../config/env.js';
import cache from './cache.js';

export async function generateSitemap() {
    try {
        const cached = cache.getCache('sitemap_xml');
        if (cached) return cached;

        const smStream = new SitemapStream({ hostname: BASE_URL || 'http://localhost:4400' });

        // Add static routes
        smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
        smStream.write({ url: '/products', changefreq: 'daily', priority: 0.8 });
        smStream.write({ url: '/categories', changefreq: 'weekly', priority: 0.7 });
        smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.5 });

        // Add dynamic product routes from Prisma
        const products = await prisma.product.findMany({ where: { status: true }, select: { slug: true, updatedAt: true } });
        products.forEach(product => {
            smStream.write({ url: `/product/${product.slug}`, changefreq: 'weekly', priority: 0.8, lastmod: product.updatedAt });
        });

        // Add dynamic category routes
        const categories = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
        categories.forEach(category => {
            smStream.write({ url: `/category/${category.slug}`, changefreq: 'weekly', priority: 0.7, lastmod: category.updatedAt });
        });

        smStream.end();
        const buffer = await streamToPromise(smStream);
        // cache sitemap for 10 minutes
        cache.setCache('sitemap_xml', buffer, 600);
        return buffer;
    } catch (error) {
        throw error;
    }
}