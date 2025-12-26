import { generateSitemap } from '../utilities/sitemap.js';

export const serveSitemap = async (req, res) => {
 try {
    const smStream = new SitemapStream({
      hostname: 'http://localhost:4400',
    });

    // Static pages
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/about', changefreq: 'monthly' });

    // Categories
    const categories = await Category.find({ isActive: true });
    categories.forEach(cat => {
      smStream.write({
        url: `/category/${cat.slug}`,
        changefreq: 'weekly',
        priority: 0.8
      });
    });

    // Products
    const products = await Product.find({ status: 'active' });
    products.forEach(product => {
      smStream.write({
        url: `/product/${product.slug}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: product.updatedAt
      });
    });

    smStream.end();

    const sitemap = await streamToPromise(smStream);

    res.header('Content-Type', 'application/xml');
    res.send(sitemap.toString());
  } catch (err) {
    res.status(500).send(err.toString());
  }
};