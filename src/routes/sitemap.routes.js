import express from 'express';
import { serveSitemap } from '../controllers/sitemap.controllers.js';

const sitemapRouter = express.Router();

sitemapRouter.get('/sitemap.xml', serveSitemap);

export default sitemapRouter;