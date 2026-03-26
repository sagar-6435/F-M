# Friends & Memories - Deployment Guide

## Live URLs

- **Frontend**: https://friendsandmemories.vercel.app/
- **Backend API**: https://f-m-8146.onrender.com/api
- **Admin Dashboard**: https://friendsandmemories.vercel.app/admin

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                        │
│         https://friendsandmemories.vercel.app/              │
│  - React + TypeScript                                       │
│  - Vite build tool                                          │
│  - Tailwind CSS                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Render (Backend)                          │
│        https://f-m-8146.onrender.com/api                    │
│  - Express.js                                               │
│  - Node.js                                                  │
│  - MongoDB (optional)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Deployment (Vercel)

### Deployed Features
- Home page with branch information
- Booking system with multi-step form
- Admin dashboard for managing bookings
- Gallery page
- Contact page
- Responsive design

### Environment Variables
```
VITE_API_URL=https://f-m-8146.onrender.com/api
```

### How to Update Frontend
1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys on push

## Backend Deployment (Render)

### Deployed Features
- Branch management API
- Service pricing API
- Cake and decoration options
- Booking management
- Admin authentication
- Payment processing
- Time slot availability

### Environment Variables (Set in Render Dashboard)
```
NODE_ENV=production
JWT_SECRET=f001e38f938d6167a94727afd0a452345a0a6e647599caaf5526de1f03f1c56c
ADMIN_PASSWORD=admin123
MONGODB_URI_BRANCH1=mongodb+srv://...
MONGODB_URI_BRANCH2=mongodb+srv://...
```

### How to Update Backend
1. Make changes locally
2. Commit and push to GitHub
3. Render automatically deploys on push (if auto-deploy enabled)
4. Or manually trigger deploy from Render dashboard

## API Endpoints

### Base URL
```
https://f-m-8146.onrender.com/api
```

### Key Endpoints
- `GET /branches` - Get all branches
- `GET /occasions` - Get all occasions
- `GET /cakes` - Get all cakes
- `GET /decorations` - Get all decorations
- `GET /pricing` - Get pricing information
- `POST /bookings` - Create a booking
- `POST /admin/login` - Admin login
- `GET /admin/dashboard/stats` - Dashboard statistics

## Admin Access

### Login Credentials
- **URL**: https://friendsandmemories.vercel.app/admin
- **Password**: admin123

### Admin Features
- View all bookings
- Filter by branch and payment status
- View booking details
- Manage pricing
- View dashboard statistics

## Monitoring

### Frontend (Vercel)
- Visit Vercel dashboard: https://vercel.com/dashboard
- Check deployment logs
- Monitor performance metrics

### Backend (Render)
- Visit Render dashboard: https://dashboard.render.com
- Check service logs
- Monitor resource usage
- View error logs

## Troubleshooting

### Frontend Issues
- **Page not loading**: Check Vercel deployment status
- **API calls failing**: Verify backend URL in environment variables
- **Styling issues**: Clear browser cache and rebuild

### Backend Issues
- **Service not responding**: Check Render logs
- **Database connection errors**: Verify MongoDB URIs
- **Authentication errors**: Check JWT_SECRET is set correctly

## Performance Tips

### Frontend
- Images are optimized
- Code splitting enabled
- Lazy loading for routes
- CSS minification

### Backend
- Connection pooling for MongoDB
- Request validation
- Error handling
- CORS enabled for frontend

## Security

### Frontend
- Environment variables for sensitive data
- No hardcoded API keys
- HTTPS only

### Backend
- JWT authentication for admin routes
- Password hashing with bcryptjs
- CORS configured
- Environment variables for secrets
- MongoDB connection strings secured

## Scaling

### Frontend
- Vercel handles auto-scaling
- CDN distribution
- Edge caching

### Backend
- Render free tier: 0.5 GB RAM, shared CPU
- Upgrade to paid plan for production
- MongoDB Atlas for database scaling

## Backup & Recovery

### Code
- GitHub repository: https://github.com/sagar-6435/F-M
- All code is version controlled
- Easy rollback to previous versions

### Database
- MongoDB Atlas automatic backups
- Configure backup retention in MongoDB Atlas

## Next Steps

1. **Monitor Performance**: Check logs regularly
2. **Update Content**: Use admin dashboard to manage data
3. **Scale if Needed**: Upgrade Render plan for production
4. **Add Features**: Deploy new features via GitHub push
5. **Security**: Regularly update dependencies

## Support

- **Frontend Issues**: Check Vercel documentation
- **Backend Issues**: Check Render documentation
- **Database Issues**: Check MongoDB Atlas documentation
- **Code Issues**: Check GitHub repository

## Contact

For deployment issues or questions, refer to:
- Vercel Support: https://vercel.com/support
- Render Support: https://support.render.com
- MongoDB Support: https://www.mongodb.com/support
