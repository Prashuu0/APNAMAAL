
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { useApp } from '../context/AppContext'
import {
  registerUser,
  registerDeliveryBoy,
  registerRestaurantOwner,
} from '../services/api'

const roles = [
  {
    value: 'user',
    label: 'Customer',
    description: 'Order food and track deliveries',
    icon: '👤',
  },
  {
    value: 'restaurant_owner',
    label: 'Restaurant Owner',
    description: 'Add and manage your restaurant',
    icon: '🍽️',
  },
  {
    value: 'delivery',
    label: 'Delivery Partner',
    description: 'Deliver orders and earn money',
    icon: '🚚',
  },
]

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'

const labelClass = 'mb-2 block text-sm font-semibold text-gray-700'

const sectionClass =
  'rounded-2xl border border-gray-100 bg-[#fffdfb] p-4 sm:p-5'

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
}

const initialDeliveryData = {
  vehicleType: 'bike',
  vehicleNumber: '',
  vehicleModel: '',
  vehicleColor: '',
  licenseNumber: '',
  licenseExpiry: '',
  aadharNumber: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
  },
  bankDetails: {
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
  },
}

const initialRestaurantData = {
  restaurantName: '',
  cuisine: '',
  description: '',
  image: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
  },
  operatingHours: {
    open: '10:00',
    close: '22:00',
  },
  deliveryFee: 30,
  freeDeliveryAbove: 500,
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
  ...props
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label} {required && '*'}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        className={inputClass}
        required={required}
        maxLength={maxLength}
        {...props}
      />
    </div>
  )
}

function Section({ icon, title, description, children }) {
  return (
    <section className={sectionClass}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
          {icon}
        </span>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const { push } = useToast()
  const { setUser } = useApp()

  const [selectedRole, setSelectedRole] = useState('')
  const [formData, setFormData] = useState(initialFormData)
  const [deliveryData, setDeliveryData] = useState(initialDeliveryData)
  const [restaurantData, setRestaurantData] = useState(initialRestaurantData)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target

    if (name.includes('.')) {
      const [parent, child] = name.split('.')

      setDeliveryData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setDeliveryData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleRestaurantChange = (e) => {
    const { name, value } = e.target

    if (name.includes('.')) {
      const [parent, child] = name.split('.')

      setRestaurantData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else if (name === 'deliveryFee' || name === 'freeDeliveryAbove') {
      setRestaurantData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10) || 0,
      }))
    } else {
      setRestaurantData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleBack = () => {
    setSelectedRole('')
    setFormData(initialFormData)
    setDeliveryData(initialDeliveryData)
    setRestaurantData(initialRestaurantData)
    setAgreeToTerms(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedRole) {
      push('Please select a role', 'error')
      return
    }

    if (!formData.fullName.trim()) {
      push('Please enter your full name', 'error')
      return
    }

    if (!agreeToTerms) {
      push('Please agree to Terms of Service to continue', 'error')
      return
    }

    if (!formData.password || formData.password.length < 8) {
      push('Password must contain at least 8 characters', 'error')
      return
    }

    if (selectedRole === 'user' && !formData.email && !formData.phone) {
      push('Please enter your email or phone number', 'error')
      return
    }

    if (formData.email && !formData.email.includes('@')) {
      push('Please enter a valid email address', 'error')
      return
    }

    if (formData.phone && formData.phone.length !== 10) {
      push('Please enter a valid 10-digit phone number', 'error')
      return
    }

    if (selectedRole === 'delivery') {
      if (!formData.phone || formData.phone.length !== 10) {
        push('Please enter valid 10-digit phone number', 'error')
        return
      }

      if (!deliveryData.vehicleNumber.trim()) {
        push('Please enter vehicle number', 'error')
        return
      }

      if (!deliveryData.licenseNumber.trim()) {
        push('Please enter license number', 'error')
        return
      }

      if (
        !deliveryData.aadharNumber.trim() ||
        deliveryData.aadharNumber.length !== 12
      ) {
        push('Please enter valid 12-digit Aadhar number', 'error')
        return
      }
    }

    if (selectedRole === 'restaurant_owner') {
      if (!restaurantData.restaurantName.trim()) {
        push('Please enter restaurant name', 'error')
        return
      }

      if (!restaurantData.cuisine.trim()) {
        push('Please enter cuisine type', 'error')
        return
      }

      if (!formData.email || !formData.email.includes('@')) {
        push('Please enter valid email address', 'error')
        return
      }
    }

    setLoading(true)

    try {
      let result

      if (selectedRole === 'delivery') {
        result = await registerDeliveryBoy({
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email || null,
          password: formData.password,
          vehicle: {
            type: deliveryData.vehicleType,
            number: deliveryData.vehicleNumber.toUpperCase(),
            model: deliveryData.vehicleModel,
            color: deliveryData.vehicleColor,
          },
          license: {
            number: deliveryData.licenseNumber.toUpperCase(),
            expiryDate: deliveryData.licenseExpiry || null,
          },
          aadhar: {
            number: deliveryData.aadharNumber,
          },
          address: deliveryData.address,
          bankDetails: deliveryData.bankDetails,
        })
      } else if (selectedRole === 'restaurant_owner') {
        result = await registerRestaurantOwner({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          restaurant: {
            name: restaurantData.restaurantName,
            image:
              restaurantData.image ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop',
            cuisine: restaurantData.cuisine,
            description: restaurantData.description,
            address: restaurantData.address,
            operatingHours: restaurantData.operatingHours,
            deliveryFee: restaurantData.deliveryFee,
            freeDeliveryAbove: restaurantData.freeDeliveryAbove,
            isOpen: true,
            rating: 0,
            deliveryTime: 30,
          },
        })
      } else {
        result = await registerUser({
          name: formData.fullName,
          email: formData.email || null,
          phone: formData.phone || null,
          password: formData.password,
        })
      }

      if (result?.user) {
        setUser(result.user)

        if (selectedRole === 'delivery') {
          push('Delivery partner registered successfully!', 'success')
        } else if (selectedRole === 'restaurant_owner') {
          push('Restaurant owner registered successfully!', 'success')
        } else {
          push('Account created successfully!', 'success')
        }

        navigate('/home')
      } else {
        push('Registration response was incomplete. Please try again.', 'error')
      }
    } catch (error) {
      push(
        error.message || 'Account creation failed. Please try again.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedRoleData = roles.find(
    (role) => role.value === selectedRole
  )

  const renderAddressFields = (data, handler, prefix) => (
    <div className="space-y-4">
      <Field
        label="Street Address"
        name={`${prefix}.street`}
        value={data.street}
        onChange={handler}
        placeholder="House number, street or locality"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="City"
          name={`${prefix}.city`}
          value={data.city}
          onChange={handler}
          placeholder="City"
        />
        <Field
          label="State"
          name={`${prefix}.state`}
          value={data.state}
          onChange={handler}
          placeholder="State"
        />
        <Field
          label="Pincode"
          name={`${prefix}.pincode`}
          value={data.pincode}
          onChange={handler}
          placeholder="Pincode"
          maxLength={6}
        />
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-100/60 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-2xl shadow-red-100/50 lg:grid-cols-[0.8fr_1.2fr]">

        {/* Branding Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 via-red-600 to-red-800 p-10 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[35px] border-white/10" />

          <div className="relative z-10">
            <Link to="/home" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg">
                🍔
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Apna<span className="text-orange-200">Maal</span>
              </span>
            </Link>

            <div className="mt-24">
              <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
                Join Our Community
              </span>

              <h1 className="mt-7 text-5xl font-extrabold leading-tight">
                Your food.
                <br />
                Your people.
                <br />
                <span className="text-orange-200">Your ApnaMaal.</span>
              </h1>

              <p className="mt-6 max-w-sm text-base leading-7 text-red-100">
                Create your account and become a part of our food-loving
                community. Delicious experiences start here.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                🍕
              </span>
              <span className="text-sm text-red-100">
                Discover amazing restaurants
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                🚀
              </span>
              <span className="text-sm text-red-100">
                Enjoy convenient food delivery
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                ❤️
              </span>
              <span className="text-sm text-red-100">
                Made with love for food lovers
              </span>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          <div className="mb-7 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2 lg:hidden">
              <span className="text-2xl">🍔</span>
              <span className="text-xl font-extrabold text-gray-900">
                Apna<span className="text-red-600">Maal</span>
              </span>
            </Link>

            <Link
              to="/home"
              className="ml-auto rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Go to home"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-600">
              Create Account
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {selectedRole ? 'Let’s get you started!' : 'Join ApnaMaal'}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {selectedRole
                ? `Create your ${selectedRoleData?.label} account.`
                : 'Choose how you want to be a part of ApnaMaal.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!selectedRole ? (
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <label className={labelClass}>Select your role *</label>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roles.map((role) => (
                      <motion.button
                        key={role.value}
                        type="button"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRole(role.value)}
                        className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50/50 hover:shadow-lg hover:shadow-red-100/50"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl transition group-hover:bg-red-100">
                          {role.icon}
                        </span>

                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-gray-900">
                            {role.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-gray-500">
                            {role.description}
                          </span>
                        </span>

                        <span className="ml-auto text-lg text-gray-300 transition group-hover:translate-x-1 group-hover:text-red-600">
                          →
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-red-600"
                  >
                    <span className="text-lg">←</span>
                    Back to role selection
                  </button>

                  {/* Common Personal Information */}
                  <Section
                    icon="👤"
                    title="Personal Information"
                    description="Enter your basic account details"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          label="Full Name"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                          autoComplete="name"
                        />
                      </div>

                      <Field
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={
                          selectedRole === 'user'
                            ? 'Email (optional)'
                            : 'Enter your email'
                        }
                        required={selectedRole === 'restaurant_owner'}
                        autoComplete="email"
                      />

                      <Field
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          }))
                        }
                        placeholder={
                          selectedRole === 'user'
                            ? 'Phone (optional)'
                            : '10-digit phone number'
                        }
                        required={selectedRole === 'delivery'}
                        maxLength={10}
                        autoComplete="tel"
                      />

                      <div className="sm:col-span-2">
                        <Field
                          label="Password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password (minimum 8 characters)"
                          required
                          autoComplete="new-password"
                        />
                        <p className="mt-2 text-xs text-gray-400">
                          Password must contain at least 8 characters.
                        </p>
                      </div>
                    </div>
                  </Section>

                  {/* Customer Information */}
                  {selectedRole === 'user' && (
                    <Section
                      icon="🍔"
                      title="You're almost there!"
                      description="Your account will let you explore restaurants and place orders."
                    >
                      <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                        <p className="text-sm font-semibold text-red-800">
                          Welcome to ApnaMaal!
                        </p>
                        <p className="mt-1 text-xs leading-5 text-red-700">
                          After registration, you can browse restaurants,
                          order food and track your deliveries.
                        </p>
                      </div>
                    </Section>
                  )}

                  {/* Delivery Partner Form */}
                  {selectedRole === 'delivery' && (
                    <>
                      <Section
                        icon="🚲"
                        title="Vehicle Information"
                        description="Tell us about the vehicle you will use"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={labelClass}>Vehicle Type *</label>
                            <select
                              name="vehicleType"
                              value={deliveryData.vehicleType}
                              onChange={handleDeliveryChange}
                              className={inputClass}
                            >
                              <option value="bike">Bike</option>
                              <option value="bicycle">Bicycle</option>
                              <option value="car">Car</option>
                            </select>
                          </div>

                          <Field
                            label="Vehicle Number"
                            name="vehicleNumber"
                            value={deliveryData.vehicleNumber}
                            onChange={handleDeliveryChange}
                            placeholder="DL01AB1234"
                            required
                          />

                          <Field
                            label="Vehicle Model"
                            name="vehicleModel"
                            value={deliveryData.vehicleModel}
                            onChange={handleDeliveryChange}
                            placeholder="Honda Activa 125"
                          />

                          <Field
                            label="Vehicle Color"
                            name="vehicleColor"
                            value={deliveryData.vehicleColor}
                            onChange={handleDeliveryChange}
                            placeholder="Black"
                          />
                        </div>
                      </Section>

                      <Section
                        icon="🪪"
                        title="Driving Licence"
                        description="Provide your licence details"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Licence Number"
                            name="licenseNumber"
                            value={deliveryData.licenseNumber}
                            onChange={handleDeliveryChange}
                            placeholder="Enter licence number"
                            required
                          />

                          <Field
                            label="Licence Expiry Date"
                            name="licenseExpiry"
                            type="date"
                            value={deliveryData.licenseExpiry}
                            onChange={handleDeliveryChange}
                          />
                        </div>
                      </Section>

                      <Section
                        icon="🆔"
                        title="Aadhaar Information"
                        description="Required for delivery partner verification"
                      >
                        <Field
                          label="Aadhaar Number"
                          name="aadharNumber"
                          value={deliveryData.aadharNumber}
                          onChange={(e) =>
                            setDeliveryData((prev) => ({
                              ...prev,
                              aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                            }))
                          }
                          placeholder="Enter 12-digit Aadhaar number"
                          maxLength={12}
                          required
                        />
                      </Section>

                      <Section
                        icon="📍"
                        title="Address Details"
                        description="Your residential address"
                      >
                        {renderAddressFields(
                          deliveryData.address,
                          handleDeliveryChange,
                          'address'
                        )}
                      </Section>

                      <Section
                        icon="🏦"
                        title="Bank Details"
                        description="Bank account details for payments"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Account Number"
                            name="bankDetails.accountNumber"
                            value={deliveryData.bankDetails.accountNumber}
                            onChange={handleDeliveryChange}
                            placeholder="Account number"
                          />

                          <Field
                            label="IFSC Code"
                            name="bankDetails.ifscCode"
                            value={deliveryData.bankDetails.ifscCode}
                            onChange={handleDeliveryChange}
                            placeholder="IFSC code"
                          />

                          <Field
                            label="Bank Name"
                            name="bankDetails.bankName"
                            value={deliveryData.bankDetails.bankName}
                            onChange={handleDeliveryChange}
                            placeholder="Bank name"
                          />

                          <Field
                            label="Account Holder Name"
                            name="bankDetails.accountHolderName"
                            value={deliveryData.bankDetails.accountHolderName}
                            onChange={handleDeliveryChange}
                            placeholder="Account holder name"
                          />
                        </div>
                      </Section>
                    </>
                  )}

                  {/* Restaurant Owner Form */}
                  {selectedRole === 'restaurant_owner' && (
                    <>
                      <Section
                        icon="🏪"
                        title="Restaurant Information"
                        description="Tell customers about your restaurant"
                      >
                        <div className="space-y-4">
                          <Field
                            label="Restaurant Name"
                            name="restaurantName"
                            value={restaurantData.restaurantName}
                            onChange={handleRestaurantChange}
                            placeholder="Enter restaurant name"
                            required
                          />

                          <Field
                            label="Cuisine Type"
                            name="cuisine"
                            value={restaurantData.cuisine}
                            onChange={handleRestaurantChange}
                            placeholder="Indian, Chinese, Italian, etc."
                            required
                          />

                          <div>
                            <label className={labelClass}>Description</label>
                            <textarea
                              name="description"
                              value={restaurantData.description}
                              onChange={handleRestaurantChange}
                              rows={3}
                              placeholder="Tell customers about your restaurant..."
                              className={inputClass}
                            />
                          </div>

                          <Field
                            label="Restaurant Image URL"
                            name="image"
                            type="url"
                            value={restaurantData.image}
                            onChange={handleRestaurantChange}
                            placeholder="https://..."
                          />
                        </div>
                      </Section>

                      <Section
                        icon="📍"
                        title="Restaurant Address"
                        description="Where customers can find your restaurant"
                      >
                        {renderAddressFields(
                          restaurantData.address,
                          handleRestaurantChange,
                          'address'
                        )}
                      </Section>

                      <Section
                        icon="🕒"
                        title="Operating Hours"
                        description="Set your restaurant's opening and closing times"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Opening Time"
                            name="operatingHours.open"
                            type="time"
                            value={restaurantData.operatingHours.open}
                            onChange={handleRestaurantChange}
                          />

                          <Field
                            label="Closing Time"
                            name="operatingHours.close"
                            type="time"
                            value={restaurantData.operatingHours.close}
                            onChange={handleRestaurantChange}
                          />
                        </div>
                      </Section>

                      <Section
                        icon="💰"
                        title="Delivery Pricing"
                        description="Configure your restaurant's delivery charges"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field
                            label="Delivery Fee (₹)"
                            name="deliveryFee"
                            type="number"
                            value={restaurantData.deliveryFee}
                            onChange={handleRestaurantChange}
                          />

                          <Field
                            label="Free Delivery Above (₹)"
                            name="freeDeliveryAbove"
                            type="number"
                            value={restaurantData.freeDeliveryAbove}
                            onChange={handleRestaurantChange}
                          />
                        </div>
                      </Section>
                    </>
                  )}

                  {/* Terms and Conditions */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1 h-5 w-5 shrink-0 accent-red-600"
                      />

                      <span className="text-sm leading-6 text-gray-600">
                        I agree to ApnaMaal's{' '}
                        <span className="font-semibold text-red-600">
                          Terms of Service
                        </span>
                        ,{' '}
                        <span className="font-semibold text-red-600">
                          Privacy Policy
                        </span>
                        {' '}and{' '}
                        <span className="font-semibold text-red-600">
                          Content Policies
                        </span>
                        .
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !agreeToTerms}
                    className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="h-5 w-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-2.647z"
                          />
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      'Create Account →'
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-7 border-t border-gray-100 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} ApnaMaal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
