# ApnaMaal Backend Server

MongoDB connected backend API for ApnaMaal food delivery app.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Make sure MongoDB is running:
```bash
mongod
```

3. Start the server:
```bash
npm run dev
```

Server will run on `http://localhost:3001`

## API Endpoints

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `GET /api/restaurants/:id/menu` - Get menu items
- `POST /api/restaurants` - Create restaurant

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:orderId` - Get order details
- `GET /api/orders/user/:userId` - Get user orders
- `PATCH /api/orders/:orderId/status` - Update order status
- `GET /api/orders/:orderId/status` - Poll order status

### Users
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/addresses` - Add address
- `POST /api/users/:id/favorites` - Add favorite
- `DELETE /api/users/:id/favorites/:restaurantId` - Remove favorite

### Delivery
- `GET /api/delivery` - Get all delivery boys
- `GET /api/delivery/:id` - Get delivery boy details
- `PATCH /api/delivery/:id/location` - Update location
- `POST /api/delivery/:id/assign-order` - Assign order

