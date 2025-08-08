# Deployment Guide

This guide will help you deploy the Founders Collaboration Platform to various hosting platforms.

## Prerequisites

1. **Supabase Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Run the database migrations from `supabase/migrations/001_initial_schema.sql`

2. **Environment Variables**
   Create a `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Deployment Options

### 1. Vercel (Recommended)

**Why Vercel?**
- Automatic deployments from Git
- Built-in environment variable management
- Excellent performance and CDN
- Free tier available

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project" and import your GitHub repository
4. Add environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy! Vercel will automatically build and deploy your app

### 2. Netlify

**Steps:**
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up
3. Click "New site from Git" and connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables in Site settings > Environment variables
7. Deploy!

### 3. AWS Amplify

**Steps:**
1. Push your code to GitHub
2. Go to AWS Amplify Console
3. Click "New app" > "Host web app"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Add environment variables in the Amplify console
7. Deploy!

### 4. Heroku

**Steps:**
1. Install Heroku CLI
2. Create a `static.json` file in the project root:
   ```json
   {
     "root": "dist",
     "routes": {
       "/**": "/index.html"
     }
   }
   ```
3. Run these commands:
   ```bash
   heroku create your-app-name
   heroku config:set VITE_SUPABASE_URL=your_url
   heroku config:set VITE_SUPABASE_ANON_KEY=your_key
   git push heroku main
   ```

## Database Setup

### Supabase Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration

### Verify Database Tables

After running the migration, you should see these tables:
- `profiles`
- `startup_ideas`
- `matches`
- `messages`
- `notifications`

## Environment Variables

Make sure to set these environment variables in your hosting platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Environment variables configured
- [ ] Authentication working (sign up/sign in)
- [ ] Profile creation working
- [ ] Match generation working
- [ ] Messaging system working
- [ ] Notifications working
- [ ] Mobile responsiveness tested
- [ ] Performance optimized

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check that all dependencies are installed: `npm install`
   - Verify TypeScript compilation: `npx tsc --noEmit`

2. **Environment Variables Not Working**
   - Ensure variables are prefixed with `VITE_`
   - Restart the development server after adding variables
   - Check hosting platform environment variable settings

3. **Database Connection Issues**
   - Verify Supabase URL and key are correct
   - Check that RLS policies are properly configured
   - Ensure database migrations have been applied

4. **Authentication Issues**
   - Verify Supabase Auth is enabled
   - Check that email confirmations are configured
   - Test signup/signin flow

### Performance Optimization

1. **Build Optimization**
   ```bash
   npm run build
   ```
   This creates an optimized production build in the `dist` folder.

2. **Image Optimization**
   - Use WebP format for images
   - Implement lazy loading for images
   - Optimize image sizes

3. **Code Splitting**
   - The app already uses Vite's automatic code splitting
   - Consider implementing route-based code splitting for larger apps

## Monitoring

### Recommended Tools

1. **Vercel Analytics** (if using Vercel)
2. **Google Analytics**
3. **Sentry** for error tracking
4. **Supabase Dashboard** for database monitoring

### Health Checks

Set up health check endpoints to monitor your application:

```typescript
// Add to your app
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to Git
   - Use different keys for development and production
   - Rotate keys regularly

2. **CORS Configuration**
   - Configure CORS in Supabase if needed
   - Restrict origins to your domain

3. **Rate Limiting**
   - Implement rate limiting for API calls
   - Monitor for abuse

## Support

If you encounter issues during deployment:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html)
3. Create an issue in this repository
4. Contact support at support@foundercollab.com

---

Happy deploying! 🚀 