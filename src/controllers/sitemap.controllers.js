import { generateSitemap } from '../utilities/sitemap.js';

export const serveSitemap = async (req, res) => {
    try {
        const sitemap = await generateSitemap();
        
        res.header('Content-Type', 'application/xml');
        res.header('Content-Encoding', 'gzip');
        
        res.send(sitemap);
    } catch (error) {
        console.error('Sitemap serve error:', error);
        res.status(500).send('Error generating sitemap');
    }
};