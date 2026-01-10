import { generateSitemap } from '../utilities/sitemap.js';

export const serveSitemap = async (req, res) => {
  try {
    const buffer = await generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(buffer.toString());
  } catch (err) {
    res.status(500).send(err.toString());
  }
};