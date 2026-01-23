# Deployment Guide

## Prerequisites

- Node.js 20.x or higher
- npm or pnpm
- Git

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Node Environment
NODE_ENV=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://ws.example.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_MULTIPLAYER=true
NEXT_PUBLIC_ENABLE_CRYPTO=true
```

## Build Process

1. Install dependencies:
```bash
npm ci
```

2. Optimize assets:
```bash
node scripts/optimize-assets.mjs
```

3. Build for production:
```bash
npm run build
```

4. Start production server:
```bash
npm start
```

## Deployment Platforms

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Server

1. Build the application
2. Copy `.next/` folder to server
3. Install production dependencies
4. Run with PM2 or similar process manager

## Performance Optimization

- Assets are automatically optimized to WebP format
- Enable CDN for static assets
- Configure caching headers
- Use database connection pooling

## Monitoring

- Errors are tracked with Sentry (if configured)
- Performance metrics via Web Vitals
- Server logs via stdout

## Backup Strategy

- Database: Daily automated backups
- Save states: Stored in localStorage (client-side)
- Assets: Version controlled in Git

## Scaling

- Horizontal scaling: Deploy multiple instances behind load balancer
- Database: Use read replicas for heavy read operations
- CDN: Serve static assets from edge locations

## Troubleshooting

### Build Fails
- Check Node.js version (must be 20.x+)
- Clear `.next/` and `node_modules/`, reinstall
- Verify all environment variables are set

### Performance Issues
- Enable production mode
- Check asset optimization ran successfully
- Monitor database query performance
- Review browser console for errors

### Memory Leaks
- Restart application periodically
- Monitor memory usage with PM2 or similar
- Check for unclosed connections

## Security Checklist

- [ ] All environment variables are set
- [ ] Secrets are not committed to Git
- [ ] HTTPS is enabled
- [ ] Database uses SSL connection
- [ ] Rate limiting is configured
- [ ] Input validation is enabled
- [ ] CORS is properly configured
