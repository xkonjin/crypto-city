/**
 * SEO and Meta Tags
 * Issue #250: Add SEO Optimization and Meta Tags
 * 
 * Provides utilities for managing SEO meta tags and Open Graph data
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'game';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
}

/**
 * Default SEO configuration
 */
export const defaultSEO: SEOConfig = {
  title: 'Plasma City - Crypto City Building Game',
  description: 'Build and manage your own crypto-themed city. Trade tokens, manage resources, and grow your blockchain metropolis.',
  keywords: ['crypto', 'city builder', 'blockchain', 'game', 'simulation', 'strategy'],
  image: '/og-image.png',
  type: 'game',
  author: 'Plasma City Team',
  siteName: 'Plasma City',
};

/**
 * Generate meta tags for a page
 */
export function generateMetaTags(config: Partial<SEOConfig> = {}): Record<string, string> {
  const seo = { ...defaultSEO, ...config };
  
  return {
    // Basic meta tags
    'title': seo.title,
    'description': seo.description,
    'keywords': seo.keywords?.join(', ') || '',
    'author': seo.author || '',
    
    // Open Graph
    'og:title': seo.title,
    'og:description': seo.description,
    'og:image': seo.image || '',
    'og:url': seo.url || '',
    'og:type': seo.type || 'website',
    'og:site_name': 'Plasma City',
    
    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': seo.title,
    'twitter:description': seo.description,
    'twitter:image': seo.image || '',
    
    // Additional
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=5',
    'theme-color': '#a855f7',
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(config: Partial<SEOConfig> = {}): string {
  const seo = { ...defaultSEO, ...config };
  
  const structuredData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    'name': seo.title,
    'description': seo.description,
    'image': seo.image,
    'url': seo.url,
    'author': {
      '@type': 'Organization',
      'name': seo.siteName,
    },
    'genre': 'City Building Simulation',
    'gamePlatform': 'Web Browser',
    'applicationCategory': 'Game',
  };
  
  if (seo.publishedTime) {
    structuredData['datePublished'] = seo.publishedTime;
  }
  
  if (seo.modifiedTime) {
    structuredData['dateModified'] = seo.modifiedTime;
  }
  
  return JSON.stringify(structuredData);
}

/**
 * Generate sitemap entry
 */
export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const urls = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl: string, disallowPaths: string[] = []): string {
  const disallows = disallowPaths.map(path => `Disallow: ${path}`).join('\n');
  
  return `User-agent: *
${disallows || 'Allow: /'}

Sitemap: ${sitemapUrl}`;
}

/**
 * Page-specific SEO configurations
 */
export const pageSEO = {
  home: {
    title: 'Plasma City - Build Your Crypto Metropolis',
    description: 'Start building your crypto city today. Manage resources, trade tokens, and create a thriving blockchain economy.',
  },
  game: {
    title: 'Play Plasma City - Crypto City Builder',
    description: 'Build and manage your crypto city. Place buildings, manage citizens, and grow your economy.',
  },
  coop: {
    title: 'Co-op Mode - Plasma City',
    description: 'Play Plasma City with friends in co-op mode. Build cities together and share resources.',
  },
};
