"use client"

import Link from "next/link"
import { motion, MotionProps } from "framer-motion"

const GridBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute w-full h-full bg-[linear-gradient(transparent_1px,_white_1px),_linear-gradient(90deg,transparent_1px,_white_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_70%,transparent_100%)] opacity-30"></div>
    </div>
  )
}

const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 mix-blend-multiply blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-pink-50 to-orange-50 mix-blend-multiply blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative">
      <GridBackground />
      <FloatingShapes />
      <main className="max-w-7xl mx-auto px-6 relative z-0">
        {/* Hero Section */}
        <section className="pt-32 pb-24">
          <motion.div 
            className="max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-light text-black mb-8 tracking-tight leading-none">
              On-Chain
              <br />
              Credit Scoring
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 font-light mb-16 max-w-2xl leading-relaxed">
              Transparent, verifiable credit analysis based on your DeFi positions and on-chain activity.
            </p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/analysis"
                className="inline-block px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-all"
              >
                Get Your Score
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 border-t border-gray-200">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="space-y-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 border-2 border-black rotate-45"></div>
              <h3 className="text-xl font-medium text-black uppercase tracking-wide">Transparent</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                All calculations are open-source and verifiable on-chain. No hidden algorithms or black boxes.
              </p>
            </motion.div>

            <motion.div 
              className="space-y-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 border-2 border-black rounded-full"></div>
              <h3 className="text-xl font-medium text-black uppercase tracking-wide">Real-Time</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Your credit score updates automatically based on your latest DeFi positions and activities.
              </p>
            </motion.div>

            <motion.div 
              className="space-y-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 border-2 border-black"></div>
              <h3 className="text-xl font-medium text-black uppercase tracking-wide">Portable</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Mint your score as an SBT and carry your reputation across the entire DeFi ecosystem.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 border-t border-gray-200">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-light text-black mb-16 uppercase tracking-wide">How It Works</h2>

            <div className="space-y-12">
              <motion.div 
                className="flex items-start space-x-8"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl font-light text-gray-400 mt-1">01</div>
                <div>
                  <h3 className="text-xl font-medium text-black mb-3 uppercase tracking-wide">Connect Wallet</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Connect your wallet to analyze your DeFi positions across supported protocols.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-8"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl font-light text-gray-400 mt-1">02</div>
                <div>
                  <h3 className="text-xl font-medium text-black mb-3 uppercase tracking-wide">Analyze Positions</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Our algorithm evaluates your health factor, LTV ratios, collateral value, and borrowing discipline.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-8"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl font-light text-gray-400 mt-1">03</div>
                <div>
                  <h3 className="text-xl font-medium text-black mb-3 uppercase tracking-wide">Get Your Score</h3>
                  <p className="text-gray-600 font-light leading-relaxed">
                    Receive a comprehensive credit score from 0-100 with detailed breakdown and risk assessment.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-24 border-t border-gray-200">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-light text-black mb-8 tracking-tight">
              Ready to discover your on-chain credit score?
            </h2>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/analysis"
                className="inline-block px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-all"
              >
                Start Analysis
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500 font-mono">© 2024 SCOREX. Built for the future of DeFi.</div>

            <div className="flex space-x-8 text-sm text-gray-500 uppercase tracking-wide">
              <motion.a 
                href="#" 
                className="hover:text-black transition-colors"
                whileHover={{ y: -2 }}
              >
                Documentation
              </motion.a>
              <motion.a 
                href="#" 
                className="hover:text-black transition-colors"
                whileHover={{ y: -2 }}
              >
                GitHub
              </motion.a>
              <motion.a 
                href="#" 
                className="hover:text-black transition-colors"
                whileHover={{ y: -2 }}
              >
                Contact
              </motion.a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
