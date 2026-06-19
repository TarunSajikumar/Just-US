'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import StatsBar from '@/components/StatsBar'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Testimonials from '@/components/Testimonials'
import Download from '@/components/Download'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ThreeBackground from '@/components/ThreeBackground'
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const mainRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 400 })
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, 200])
  const bgOpacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [1, 0.95, 0.85, 0.8])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll progress bar
  useEffect(() => {
    const bar = document.getElementById('scroll-progress')
    if (!bar) return
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      bar.style.width = scrolled + '%'
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div id="scroll-progress" />
      <CustomCursor />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.25]">
        <EtheralShadow
          color="rgba(201, 169, 110, 1)"
          animation={{ scale: 100, speed: 70 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
          showTitle={false}
        />
      </div>
      <ThreeBackground mousePosition={mousePosition} />

      {/* Grain overlay */}
      <div className="grain fixed inset-0 pointer-events-none z-[1]" />

      {/* Ambient background blobs */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY, opacity: bgOpacity }}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A96E]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#B8914A]/8 rounded-full blur-[120px]" />
      </motion.div>

      <Navbar />

      <main ref={mainRef} className="relative z-[4]">
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Download />
        <Footer />
      </main>
    </>
  )
}
