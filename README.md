# 🍽️ ApnaMaal – Food Delivery Platform

**ApnaMaal** is a full-stack food delivery web application designed to make discovering restaurants, exploring menus, and ordering food simple and convenient.

Built using the **MERN Stack**, ApnaMaal provides a user-friendly experience with restaurant discovery, food ordering, order tracking, and personalized features.

---

## 🚀 Features

- 🔐 **User Authentication** – User registration and login.
- 🍴 **Restaurant Discovery** – Browse and explore restaurants.
- 🔎 **Restaurant Search** – Search restaurants based on user preferences.
- 📋 **Menu Browsing** – Explore restaurant menus and food items.
- 🛒 **Shopping Cart** – Add and manage food items before checkout.
- 📦 **Order Management** – Place orders and view order history.
- 🚚 **Order Tracking** – Track order status.
- ⭐ **Reviews & Ratings** – Share feedback and rate restaurants.
- 🔁 **Reorder** – Easily reorder previous orders.
- 📅 **Scheduled Orders** – Schedule food orders.
- ❤️ **Favorites & Wishlist** – Save favorite restaurants.
- 🏷️ **Coupons & Offers** – Apply promotional discounts.
- 🌙 **Dark Mode** – Switch between light and dark themes.
- 💰 **Transparent Pricing** – View pricing details.
- 🥗 **Dietary Filters** – Discover food according to dietary preferences.
- 🗺️ **Restaurant Map** – Explore restaurants through an interactive map.
- 📱 **Responsive UI** – Designed for a smooth experience across devices.

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Leaflet
- HTML5 & CSS3

### Backend

- Node.js
- Express.js
- REST APIs

### Database

- MongoDB
- Mongoose

### Development Tools

- Git & GitHub
- VS Code
- Postman
- npm

## 📂 Project Structure

```text
ApnaMaal/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── assets/
│   └── ...
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── data/
│   └── ...
│
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Prashuu0/APNAMAAL.git
```

### 2. Navigate to the Project

```bash
cd ApnaMaal
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Configure Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/apnamaal
JWT_SECRET=your_secret_key
```

Configure your environment variables before starting the application.

### 5. Start the Backend

```bash
npm start
```

### 6. Start the Frontend

Open another terminal:

```bash
cd ApnaMaal
npm run dev
```

The application will be available at:

**Frontend:** http://localhost:5173

**Backend:** http://localhost:3001

## 🗄️ Database

ApnaMaal uses MongoDB to store application data.

Make sure MongoDB is installed and running before starting the backend server.

## 🔮 Future Enhancements

- Online payment gateway integration.
- Real-time delivery partner tracking.
- Restaurant owner dashboard.
- Admin dashboard and analytics.
- Push notifications.
- Improved recommendation system.

## 🎯 Project Objective

The main objective of ApnaMaal is to build a scalable and user-friendly food delivery platform that connects customers with restaurants through a seamless digital ordering experience.

## 👨‍💻 Developer

**Prashant Kumar**

Full Stack Developer | MERN Stack

GitHub: [@Prashuu0](https://github.com/Prashuu0)

---

⭐ If you like this project, consider giving it a star on GitHub!

**Made with ❤️ and MERN Stack – ApnaMaal**
