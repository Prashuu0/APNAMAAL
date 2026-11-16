import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import Restaurant from './models/Restaurant.js'
import MenuItem from './models/MenuItem.js'
import User from './models/User.js'
import DeliveryBoy from './models/DeliveryBoy.js'
import bcrypt from 'bcryptjs'

// Sample data
const restaurants = [
  {
    name: 'Bombay Spice Kitchen',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop',
    cuisine: 'Indian',
    description: 'Authentic North Indian flavors',
    rating: 4.5,
    deliveryTime: 30,
    costForTwo: 500,
    offer: 'Flat ₹80 off',
    isOpen: true,
    operatingHours: { open: '10:00', close: '23:00' },
    deliveryFee: 30,
    freeDeliveryAbove: 500
  },
  {
    name: 'Sushi Street',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1600&auto=format&fit=crop',
    cuisine: 'Japanese',
    description: 'Fresh sushi and Japanese cuisine',
    rating: 4.3,
    deliveryTime: 25,
    costForTwo: 800,
    offer: 'Free miso soup',
    isOpen: true,
    operatingHours: { open: '11:00', close: '22:00' },
    deliveryFee: 40,
    freeDeliveryAbove: 600
  },
  {
    name: 'Pizza Yard',
    image: 'https://images.unsplash.com/photo-1548365328-9f547fb0953b?q=80&w=1600&auto=format&fit=crop',
    cuisine: 'Italian',
    description: 'Wood-fired pizzas and pasta',
    rating: 4.1,
    deliveryTime: 35,
    costForTwo: 600,
    offer: 'Buy 1 Get 1',
    isOpen: true,
    operatingHours: { open: '12:00', close: '23:00' },
    deliveryFee: 30,
    freeDeliveryAbove: 500
  },
  {
    name: 'Healthy Bowl Co.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1600&auto=format&fit=crop',
    cuisine: 'Healthy',
    description: 'Nutritious and delicious bowls',
    rating: 4.6,
    deliveryTime: 20,
    costForTwo: 450,
    isOpen: true,
    operatingHours: { open: '09:00', close: '21:00' },
    deliveryFee: 25,
    freeDeliveryAbove: 400
  }
]

const menuItems = [
  // Bombay Spice Kitchen
  { name: 'Butter Chicken', description: 'Creamy tomato-based curry', price: 350, category: 'Main Course', veg: false, restaurantId: null },
  { name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 280, category: 'Starters', veg: true, restaurantId: null },
  { name: 'Biryani', description: 'Fragrant basmati rice with spices', price: 320, category: 'Main Course', veg: false, restaurantId: null },
  { name: 'Naan', description: 'Tandoor-baked flatbread', price: 50, category: 'Bread', veg: true, restaurantId: null },
  { name: 'Gulab Jamun', description: 'Sweet milk dumplings', price: 80, category: 'Desserts', veg: true, restaurantId: null },
  
  // Sushi Street
  { name: 'Salmon Sushi Roll', description: 'Fresh salmon with rice', price: 450, category: 'Sushi', veg: false, restaurantId: null },
  { name: 'Vegetable Roll', description: 'Assorted vegetables', price: 280, category: 'Sushi', veg: true, restaurantId: null },
  { name: 'Miso Soup', description: 'Traditional Japanese soup', price: 120, category: 'Soups', veg: true, restaurantId: null },
  
  // Pizza Yard
  { name: 'Margherita Pizza', description: 'Classic cheese pizza', price: 400, category: 'Pizza', veg: true, restaurantId: null },
  { name: 'Pepperoni Pizza', description: 'Spicy pepperoni', price: 550, category: 'Pizza', veg: false, restaurantId: null },
  { name: 'Pasta Alfredo', description: 'Creamy white sauce pasta', price: 380, category: 'Pasta', veg: true, restaurantId: null },
  
  // Healthy Bowl Co.
  { name: 'Quinoa Bowl', description: 'Protein-rich quinoa', price: 320, category: 'Bowls', veg: true, restaurantId: null },
  { name: 'Greek Salad', description: 'Fresh vegetables', price: 250, category: 'Salads', veg: true, restaurantId: null },
  { name: 'Green Smoothie', description: 'Healthy vegetable blend', price: 180, category: 'Drinks', veg: true, restaurantId: null }
]

async function seed() {
  try {
    await connectDB()
    
    // Clear existing data
    await Restaurant.deleteMany({})
    await MenuItem.deleteMany({})
    await User.deleteMany({})
    await DeliveryBoy.deleteMany({})
    
    console.log('📦 Seeding restaurants...')
    const savedRestaurants = await Restaurant.insertMany(restaurants)
    console.log(`✅ Created ${savedRestaurants.length} restaurants`)
    
    console.log('📦 Seeding menu items...')
    const restaurantIds = savedRestaurants.map(r => r._id)
    let menuIndex = 0
    
    for (let i = 0; i < savedRestaurants.length; i++) {
      const restaurantId = restaurantIds[i]
      const itemsPerRestaurant = i === 0 ? 5 : i === 1 ? 3 : i === 2 ? 3 : 3
      
      for (let j = 0; j < itemsPerRestaurant; j++) {
        if (menuIndex < menuItems.length) {
          menuItems[menuIndex].restaurantId = restaurantId
          menuIndex++
        }
      }
    }
    
    const itemsToInsert = menuItems.slice(0, menuIndex).map(item => {
      const { restaurantId, ...rest } = item
      return { ...rest, restaurantId }
    })
    
    await MenuItem.insertMany(itemsToInsert)
    console.log(`✅ Created ${itemsToInsert.length} menu items`)
    
    // Create demo user
    console.log('📦 Seeding demo user...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@apnamaal.com',
      phone: '1234567890',
      password: hashedPassword
    })
    console.log(`✅ Created demo user: ${demoUser.email}`)
    
    // Create demo delivery boy
    console.log('📦 Seeding delivery boy...')
    const deliveryPassword = await bcrypt.hash('delivery123', 10)
    const deliveryBoy = await DeliveryBoy.create({
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh@apnamaal.com',
      password: deliveryPassword,
      vehicle: { type: 'bike', number: 'DL-01-AB-1234' },
      status: 'AVAILABLE',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        updatedAt: new Date()
      }
    })
    console.log(`✅ Created delivery boy: ${deliveryBoy.name}`)
    
    console.log('✅ Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seed()

