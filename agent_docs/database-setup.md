# Database Setup Guide

MongoDB configuration for Villages platform. Use the interactive setup for guided configuration, or manual setup for custom deployments.

## Interactive Setup (Recommended)

```bash
npx tsx scripts/initialize-database.ts
```

Choose between Local MongoDB or MongoDB Atlas with guided configuration.

## Manual Local MongoDB

```bash
# Start MongoDB with replica set
docker run --name mongodb -d -p 27017:27017 mongodb/mongodb-community-server:latest --replSet rs0

# Initialize replica set
docker exec mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

**Connection string**:
```
DATABASE_URL="mongodb://localhost:27017/villages-dev?replicaSet=rs0"
```

## MongoDB Atlas Setup

Update `.env.local` with Atlas connection string:
```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/villages?retryWrites=true&w=majority"
```

## Common Commands

```bash
npx prisma generate              # Generate Prisma client
npx prisma db push               # Push schema to database
npm run db:validate-full         # Comprehensive health checks
npm run db:seed-tags             # Initialize healthcare tag system
npm run db:backup                # Create database backup
```

## Troubleshooting

**Connection pool issues**: Restart dev server after container restarts to refresh the connection pool.

**Port conflicts**: `lsof -i :27017` to check MongoDB port usage.

---
*Reference: `scripts/initialize-database.ts`, `prisma/schema.prisma`*
