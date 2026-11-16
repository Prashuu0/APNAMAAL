import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Landing() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  const handleStartNow = () => {
    navigate('/home')
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-black overflow-x-hidden">
      {/* Hero Section with Video Background */}
      <motion.div
        style={{ opacity, scale }}
        className="fixed inset-0 z-0"
      >
        <div className="relative h-screen w-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/vddpic/2627bbed9d6c068e50d2aadcca11ddbb1743095925.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>
      </motion.div>

      {/* Hero Content */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col items-center text-white px-5 text-center"
        >
          {/* Logo */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-red-500">Apna</span>
              <span className="text-white">Maal</span>
            </h1>
          </div>

          {/* Main Heading */}
          <h2 className="mb-5 text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            India's #1<br />
            food delivery app
          </h2>

          <p className="mb-8 max-w-xl text-base md:text-lg text-gray-300 leading-relaxed">
            Experience fast & easy online ordering<br />
            on the Zomato app
          </p>

          {/* Order Now Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartNow}
            className="mb-6 rounded-xl bg-red-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl transition-all hover:bg-red-600"
          >
            Start Now
          </motion.button>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
            className="flex flex-col items-center gap-2 text-white/70"
          >
            <span className="text-sm">Scroll down</span>
            <motion.svg
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Better Food Section - White Background with Floating Food */}
      <section className="relative z-20 bg-white min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-7xl mx-auto relative w-full">
          {/* Decorative Wavy Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" style={{ zIndex: 1 }}>
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              d="M 0 150 Q 200 100 400 150 T 800 150 T 1200 150"
              stroke="#ff6b6b"
              strokeWidth="2"
              fill="none"
            />
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, delay: 0.3, ease: "easeInOut" }}
              d="M 800 350 Q 1000 300 1200 350 T 1600 350"
              stroke="#ff6b6b"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* Central Content */}
          <div className="relative z-10 text-center mb-16 md:mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-red-500 mb-6 leading-tight"
            >
              Better food for more people
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              For over a decade, we've enabled our customers to discover new tastes, delivered right to their doorstep
            </motion.p>
          </div>

          {/* Floating Food Items Container */}
          <div className="relative h-[500px] md:h-[600px] mb-16">
            {/* Large Burger - Left Center */}
            <motion.div
              initial={{ opacity: 0, x: -200, rotate: -15 }}
              whileInView={{ opacity: 1, x: 0, rotate: -8 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.3, type: "spring" }}
              className="absolute left-[5%] md:left-[8%] top-[25%] z-20"
            >
              <img
                src="/vddpic/110a09a9d81f0e5305041c1b507d0f391743058910.avif"
                alt="Burger"
                className="w-[180px] md:w-[280px] lg:w-[320px] rounded-2xl shadow-2xl"
              />
            </motion.div>

            {/* Momos - Top Right */}
            <motion.div
              initial={{ opacity: 0, x: 200, y: -100, rotate: 15 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: 8 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.5, type: "spring" }}
              className="absolute right-[5%] md:right-[8%] top-[8%] z-20"
            >
              <img
                src="/vddpic/b4f62434088b0ddfa9b370991f58ca601743060218.avif"
                alt="Momos"
                className="w-[160px] md:w-[250px] lg:w-[280px] rounded-2xl shadow-2xl"
              />
            </motion.div>

            {/* Pizza - Bottom Right */}
            <motion.div
              initial={{ opacity: 0, x: 150, y: 150, rotate: 12 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: -5 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.7, type: "spring" }}
              className="absolute right-[8%] md:right-[10%] bottom-[12%] z-20"
            >
              <img
                src="/vddpic/316495f4ba2a9c9d9aa97fed9fe61cf71743059024.avif"
                alt="Pizza"
                className="w-[140px] md:w-[220px] lg:w-[260px] rounded-2xl shadow-2xl"
              />
            </motion.div>

            {/* Small Decorative Items - Mint Leaf Top */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 15 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[18%] left-[40%] w-8 h-8 bg-green-400 rounded-full opacity-80"
            />

            {/* Small Tomato Slices */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute top-[15%] right-[25%] w-6 h-6 bg-red-500 rounded-full opacity-80"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute bottom-[20%] left-[18%] w-6 h-6 bg-red-500 rounded-full opacity-80"
            />
          </div>

          {/* Stats Cards - Exact Zomato Style */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12 rounded-2xl border border-red-100 bg-white px-8 md:px-12 py-6 md:py-8 shadow-lg max-w-5xl mx-auto"
          >
            {/* Restaurant Stat */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-left">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">3,00,000+</div>
                <div className="text-sm md:text-base text-gray-600 mt-1">restaurants</div>
              </div>
              <img
                src="/vddpic/d19ec60986487a77bcb026e5efc3325f1742908200.webp"
                alt="Restaurants"
                className="h-12 md:h-16 lg:h-20 w-auto"
              />
            </div>

            {/* Vertical Divider */}
            <div className="h-12 md:h-16 w-px bg-gray-300 hidden md:block" />

            {/* Cities Stat */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-left">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">800+</div>
                <div className="text-sm md:text-base text-gray-600 mt-1">cities</div>
              </div>
              <img
                src="/vddpic/e7533c4081d6140da37b9f430cb7b8051743006192.avif"
                alt="Cities"
                className="h-12 md:h-16 lg:h-20 w-auto"
              />
            </div>

            {/* Vertical Divider */}
            <div className="h-12 md:h-16 w-px bg-gray-300 hidden md:block" />

            {/* Orders Stat */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-left">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">3 billion+</div>
                <div className="text-sm md:text-base text-gray-600 mt-1">orders delivered</div>
              </div>
              <img
                src="/vddpic/713443cc5944ce4284d7e49e75e2aacf1742466222.avif"
                alt="Orders"
                className="h-12 md:h-16 lg:h-20 w-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What's Waiting Section - Exact Zomato Style */}
      <section className="relative z-20 bg-gradient-to-b from-red-50 via-pink-50 to-white py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-red-500 mb-6 leading-tight">
              What's waiting for you<br />on the app?
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Our app is packed with features that enable you to experience food delivery like never before
            </p>
          </motion.div>

          {/* Features Grid with Phone in Center - Phone Half Visible */}
          <div className="relative max-w-6xl mx-auto overflow-hidden">
            <div className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 relative">
              {/* Left Column - 4 cards stacked */}
              <div className="grid grid-rows-4 gap-4 md:gap-6 z-10">
                <FeatureCard name="Healthy" icon="🥗" delay={0.1} />
                <FeatureCard name="Veg Mode" icon="🌿" delay={0.2} />
                <FeatureCard name="Plan a Party" icon="🎉" delay={0.3} />
                <FeatureCard name="Gift Cards" icon="💳" delay={0.4} />
              </div>

              {/* Middle Column - Phone Half Visible (Behind cards) */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-0">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="relative"
                >
                  {/* Phone Frame - Larger to appear half */}
                  <div className="w-[180px] md:w-[260px] lg:w-[320px] h-[360px] md:h-[520px] lg:h-[640px] bg-black rounded-[2.5rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-28 h-5 md:h-7 bg-black rounded-b-xl md:rounded-b-2xl z-10" />
                      {/* Screen Content - Schedule Card */}
                      <div className="pt-8 md:pt-10 px-4 md:px-5 pb-4 md:pb-5 h-full flex flex-col items-center justify-center">
                        <div className="w-full rounded-xl md:rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-md">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="text-2xl md:text-3xl">📅</div>
                            <div className="text-xl md:text-2xl">🕐</div>
                          </div>
                          <div className="text-xs md:text-sm text-gray-700 text-center leading-tight font-medium">
                            Schedule<br />your order
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - 4 cards stacked */}
              <div className="grid grid-rows-4 gap-4 md:gap-6 z-10">
                <FeatureCard name="Gourmet" icon="🍽️" delay={0.1} />
                <FeatureCard name="Offers" icon="🎁" delay={0.2} />
                <FeatureCard name="Food on Train" icon="🚂" delay={0.3} />
                <FeatureCard name="Collections" icon="📚" delay={0.4} />
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
            className="mt-12 text-center text-xl md:text-2xl font-semibold text-gray-700"
          >
            ...and a lot more
          </motion.p>
        </div>
      </section>

      {/* Zomato Gold Section - Black Background */}
      <section className="relative z-20 bg-black py-20 md:py-32 px-4 overflow-hidden">
        {/* Golden Coins in Corners */}
        <motion.img
          initial={{ opacity: 0, scale: 0, x: -100, y: -100 }}
          whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          src="/vddpic/e7a502b732de9cd0d5ceca82306137ca1743059837.avif"
          alt="Gold Coin"
          className="absolute top-12 left-8 w-24 md:w-32 opacity-80"
        />
        <motion.img
          initial={{ opacity: 0, scale: 0, x: 100, y: -100 }}
          whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          src="/vddpic/ef5bc22bc703882ccb11a5b75ad6704b1743059783.avif"
          alt="Gold Coin"
          className="absolute top-8 right-8 w-28 md:w-36 opacity-80"
        />
        <motion.img
          initial={{ opacity: 0, scale: 0, x: 100, y: 100 }}
          whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6 }}
          src="/vddpic/e7a502b732de9cd0d5ceca82306137ca1743059837.avif"
          alt="Gold Coin"
          className="absolute bottom-16 right-16 w-20 md:w-28 opacity-80"
        />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Apna<span className="text-yellow-400">Maal</span>
            </h2>
            <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-3">GOLD</div>
            <p className="text-sm md:text-base bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 bg-clip-text text-transparent">
              India's Top Savings Program for Food Lovers
            </p>
          </motion.div>

          {/* Gold Benefits Heading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-12"
          >
            <span className="text-yellow-400 text-2xl">★</span>
            <h3 className="text-lg md:text-xl font-semibold text-white tracking-widest">
              GOLD BENEFITS
            </h3>
            <span className="text-yellow-400 text-2xl">★</span>
          </motion.div>

          {/* Benefit Cards */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row items-center gap-6 rounded-3xl border border-yellow-700/30 bg-black/50 p-6 max-w-md"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-3xl">
                🚚
              </div>
              <div>
                <div className="text-xl md:text-2xl font-semibold text-white mb-2">Free Delivery</div>
                <div className="text-sm md:text-base bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  At all restaurants within 7 km
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col md:flex-row items-center gap-6 rounded-3xl border border-yellow-700/30 bg-black/50 p-6 max-w-md"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center text-3xl">
                💰
              </div>
              <div>
                <div className="text-xl md:text-2xl font-semibold text-white mb-2">Up to 30% extra off</div>
                <div className="text-sm md:text-base bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  At 20,000+ partner restaurants
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Eternal Brands Section */}
      <section className="relative z-20 bg-white py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Eternal Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <img
              src="/vddpic/81ed35564614cbdf5188bb72dc7e57b51739536377.avif"
              alt="Eternal"
              className="h-16 md:h-24 mx-auto mb-6"
            />
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-px w-16 md:w-28 bg-gradient-to-r from-transparent to-gray-300" />
              <span className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-widest">
                POWERING INDIA'S CHANGING LIFESTYLES
              </span>
              <div className="h-px w-16 md:w-28 bg-gradient-to-l from-transparent to-gray-300" />
            </div>
          </motion.div>

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            {brands.map((brand, index) => (
              <motion.a
                key={brand.name}
                href={brand.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative flex flex-col items-center gap-4 rounded-3xl border-3 p-6 md:p-8 overflow-hidden group"
                style={{
                  background: brand.gradient,
                  borderColor: brand.borderColor
                }}
              >
                <div className="absolute right-[-100px] top-[-100px] w-64 h-64 rounded-full opacity-20 blur-3xl"
                  style={{ background: brand.blurColor }}
                />
                <div className="relative z-10">
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="h-32 md:h-40 w-auto rounded-3xl mb-4"
                  />
                </div>
                <div className="relative z-10 text-center">
                  <div className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">{brand.name}</div>
                  <div className="text-sm md:text-base text-gray-600 mb-4">{brand.description}</div>
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700 group-hover:text-red-500 transition-colors">
                    Check it out
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Download App Section - Exact Zomato Style */}
      <section className="relative z-20 bg-gradient-to-t from-red-50 to-white py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[45px] p-[5px] shadow-xl"
            style={{
              background: 'linear-gradient(180deg, #FFEDEF 0%, #FFDBE0 100%)'
            }}
          >
            <div className="rounded-[40px] bg-gradient-to-b from-white to-red-50 p-8 md:p-12 lg:p-16">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
                {/* Left Side - Text and Buttons */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex-1 max-w-lg"
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    Download the app now!
                  </h2>
                  <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                    Experience seamless online ordering<br />
                    only on the ApnaMaal app
                  </p>
                  {/* App Store Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Google Play Button */}
                    <div className="h-12 md:h-14 w-full sm:w-[160px] rounded-lg bg-black flex items-center justify-center px-4 cursor-pointer hover:opacity-90 transition-opacity">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5Z" fill="#4285F4"/>
                          <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#34A853"/>
                          <path d="M3.84 2.15L13.69 12L3.84 21.85L3 20.5V3.5L3.84 2.15Z" fill="#EA4335"/>
                          <path d="M16.81 8.88L14.54 11.15L6.05 2.66L16.81 8.88Z" fill="#FBBC04"/>
                        </svg>
                        <div className="text-white text-[10px] leading-tight">
                          <div>GET IT ON</div>
                          <div className="text-sm font-semibold">Google Play</div>
                        </div>
                      </div>
                    </div>
                    {/* App Store Button */}
                    <div className="h-12 md:h-14 w-full sm:w-[160px] rounded-lg bg-black flex items-center justify-center px-4 cursor-pointer hover:opacity-90 transition-opacity">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <div className="text-white text-[10px] leading-tight">
                          <div>Download on the</div>
                          <div className="text-sm font-semibold">App Store</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right Side - Phone with QR Code */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative flex-1 flex justify-center max-w-md"
                >
                  <div className="relative">
                    {/* Phone Frame */}
                    <div className="w-[180px] md:w-[240px] lg:w-[280px] h-[360px] md:h-[480px] lg:h-[560px] bg-black rounded-[2.5rem] md:rounded-[3rem] p-2.5 md:p-3 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-end pb-6 md:pb-8">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-28 lg:w-32 h-6 md:h-8 bg-black rounded-b-2xl md:rounded-b-3xl z-10" />
                        {/* QR Code Content */}
                        <div className="text-center px-3 md:px-4 w-full">
                          <p className="text-[10px] md:text-xs lg:text-sm text-gray-600 mb-3 md:mb-4 leading-tight px-2">
                            Scan the QR code to download the app
                          </p>
                          {/* QR Code */}
                          <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-white border-2 md:border-4 border-black mx-auto relative">
                            {/* QR Code Grid Pattern */}
                            <div className="w-full h-full p-1.5 md:p-2 grid grid-cols-7 gap-0.5 md:gap-1">
                              {Array.from({ length: 49 }).map((_, i) => {
                                const row = Math.floor(i / 7)
                                const col = i % 7
                                const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2)
                                const shouldFill = isCorner || (i % 4 === 0) || (row % 3 === 0 && col % 2 === 0)
                                return (
                                  <div
                                    key={i}
                                    className={`${shouldFill ? 'bg-black' : 'bg-white'} ${isCorner ? 'rounded-sm' : ''}`}
                                  />
                                )
                              })}
                            </div>
                            {/* Red corners for Zomato branding */}
                            <div className="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-tl-sm" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-tr-sm" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 bg-red-500 rounded-bl-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 bg-black text-white py-16 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <h3 className="text-3xl md:text-4xl font-bold">apnamaal</h3>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Eternal */}
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-300 mb-4">Eternal</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Zomato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blinkit</a></li>
                <li><a href="#" className="hover:text-white transition-colors">District</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hyperpure</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Feeding India</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investor Relations</a></li>
              </ul>
            </div>

            {/* For Restaurants */}
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-300 mb-4">For Restaurants</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Partner With Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Apps For You</a></li>
              </ul>
            </div>

            {/* For Delivery Partners */}
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-300 mb-4">For Delivery Partners</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Partner With Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Apps For You</a></li>
              </ul>
            </div>

            {/* Learn More */}
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-300 mb-4">Learn More</h4>
              <ul className="space-y-2 text-sm md:text-base text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help & Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report a Fraud</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-300 mb-4">Social Links</h4>
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                  <span className="text-white text-sm">in</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                  <span className="text-white text-sm">IG</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                  <span className="text-white text-sm">▶</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 cursor-pointer">
                  <span className="text-white text-sm">f</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 cursor-pointer">
                  <span className="text-black text-xs">X</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-12 w-32 rounded-lg bg-gray-800" />
                <div className="h-12 w-32 rounded-lg bg-gray-800" />
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800 text-xs md:text-sm text-gray-500">
            <p>
              By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies.
              <br />
              All trademarks are properties of their respective owners.
              <br />
              2008-2025 © ApnaMaal™ Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Feature Card Component - Exact Zomato Style
function FeatureCard({ name, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-md cursor-pointer transition-all hover:shadow-lg"
    >
      <div className="flex flex-col items-center justify-center gap-2 min-h-[90px] md:min-h-[110px]">
        <div className="text-3xl md:text-4xl lg:text-5xl mb-1">{icon}</div>
        <div className="text-[11px] md:text-xs lg:text-sm font-normal text-gray-700 text-center px-1 leading-tight">
          {name}
        </div>
      </div>
    </motion.div>
  )
}

const brands = [
  {
    name: 'zomato',
    image: '/vddpic/d1eee2be61cf47e2332cb7c49475c0981739777714.avif',
    description: 'Get the app now to start ordering your favorite dishes!',
    gradient: 'linear-gradient(to bottom, #FFEDEF, #FFF)',
    borderColor: '#ff6b6b',
    blurColor: '#FFC6CD',
    link: '/home'
  },
  {
    name: 'blinkit',
    image: '/vddpic/071cb96db84f20eea3a39804e113bdee1739777655.avif',
    description: 'Choose from 10,000+ products & get them delivered in minutes',
    gradient: 'linear-gradient(to bottom, #FFF9E5, #FFF9E5)',
    borderColor: '#FAECBD',
    blurColor: '#FFEEAF',
    link: '#'
  },
  {
    name: 'district',
    image: '/vddpic/38bf2d77d9391b8b1866e3ae2b5fe19a1739777683.avif',
    description: 'The best of events, movies, dining, and everything you love!',
    gradient: 'linear-gradient(to bottom, #F2ECFF, #FAF8FE)',
    borderColor: '#DFCFFF',
    blurColor: '#DFCFFF',
    link: '#'
  },
  {
    name: 'hyperpure',
    image: '/vddpic/d1eee2be61cf47e2332cb7c49475c0981739777714.avif',
    description: 'Offering complete supply chain solution for your restaurant',
    gradient: 'linear-gradient(to bottom, #FFEDEF, #FFF)',
    borderColor: '#ff6b6b',
    blurColor: '#FFC6CD',
    link: '#'
  },
]
