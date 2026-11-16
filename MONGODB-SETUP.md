# 🚀 MongoDB Setup Guide - ApnaMaal

## ✅ Complete MongoDB Integration Done!

Ab pure project MongoDB se connected hai. Sab data database mein store hoga!

---

## 📋 **REQUIREMENTS**

1. **MongoDB** installed aur running hona chahiye
2. MongoDB connection: `mongodb://localhost:27017/`
3. Node.js (backend ke liye)

---

## 🛠️ **SETUP STEPS**

### Step 1: MongoDB Check Karein

```bash
# MongoDB service check karein (Windows)
# MongoDB service start honi chahiye
```

MongoDB `mongodb://localhost:27017/` par chal raha hai verify karein.

### Step 2: Backend Dependencies Install Karein

```bash
cd apna-maal-web/server
npm install
```

### Step 3: Database Seed Karein (First Time)

```bash
# Seed script run karein - initial data add hoga
cd apna-maal-web/server
node seed.js
```

**Ya seed.bat file run karein:**
```
apna-maal-web/server/SEED.bat
```

Ye automatically:
- ✅ 4 Restaurants create karega
- ✅ 14 Menu items add karega
- ✅ Demo user create karega
- ✅ Delivery boy add karega

### Step 4: Backend Server Start Karein

```bash
cd apna-maal-web/server
npm run dev
```

**Ya start.bat file use karein:**
```
apna-maal-web/server/start.bat
```

Server `http://localhost:3001` par start hoga.

### Step 5: Frontend Start Karein

**Nayi terminal mein:**
```bash
cd apna-maal-web
npm run dev
```

Frontend `http://localhost:5173` par start hoga.

---

## 🎯 **QUICK START (Single Command)**

**Windows mein ek hi command se sab start karein:**
```
apna-maal-web/START-PROJECT.bat
```

Ye automatically:
1. Backend dependencies install karega
2. Database seed karega (first time)
3. Backend server start karega (Port 3001)
4. Frontend start karega (Port 5173)

---

## 📊 **DATABASE STRUCTURE**

### Collections Created:

1. **users** - User data, addresses, favorites
2. **restaurants** - Restaurant info, timing, offers
3. **menuitems** - Menu items with categories
4. **orders** - Order details, status, delivery info
5. **deliveryboys** - Delivery boy location, status

---

## 🔌 **API ENDPOINTS**

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `GET /api/restaurants/:id/menu` - Get menu items
- `POST /api/restaurants` - Create restaurant

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/user/:userId` - Get user orders
- `GET /api/orders/:orderId/status` - Poll order status

### Users
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/addresses` - Add address
- `POST /api/users/:id/favorites` - Add favorite

### Delivery
- `GET /api/delivery` - Get delivery boys
- `PATCH /api/delivery/:id/location` - Update location
- `POST /api/delivery/:id/assign-order` - Assign order

---

## ✅ **VERIFICATION**

1. **Backend check:**
   - Open: `http://localhost:3001/api/health`
   - Should show: `{ status: 'OK', database: 'MongoDB Connected' }`

2. **Frontend check:**
   - Open: `http://localhost:5173`
   - Restaurants load hone chahiye MongoDB se!

3. **Database check:**
   ```bash
   # MongoDB Compass mein ya mongo shell mein
   use apnamaal
   show collections
   db.restaurants.find()
   ```

---

## 🔧 **TROUBLESHOOTING**

### Problem: MongoDB connection error
**Solution:** 
- MongoDB service running hai verify karein
- Connection string: `mongodb://localhost:27017/`

### Problem: Port 3001 already in use
**Solution:**
- `server/index.js` mein PORT change karein
- Ya running process ko stop karein

### Problem: No restaurants showing
**Solution:**
- Seed script run karein: `node server/seed.js`
- Check karein database mein data hai ya nahi

### Problem: Frontend not connecting to backend
**Solution:**
- Backend server running hai verify karein
- `.env.local` file check karein: `VITE_API_URL=http://localhost:3001/api`

---

## 📝 **IMPORTANT NOTES**

1. **Database Name:** `apnamaal` (automatically created)
2. **Connection String:** `mongodb://localhost:27017/apnamaal`
3. **Backend Port:** `3001`
4. **Frontend Port:** `5173`
5. **Seed Data:** First time seed script zaroor run karein

---

## 🎉 **DONE!**

Ab sab kuch MongoDB se connected hai:
- ✅ Restaurants database mein
- ✅ Menu items database mein  
- ✅ User data database mein
- ✅ Orders database mein
- ✅ Delivery boys database mein

**Happy Coding! 🚀**

