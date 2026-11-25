import { useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Menu } from './components/Menu'
import { Testimonials } from './components/Testimonials'
import { Experiences } from './components/Experiences'
import { Footer } from './components/Footer'

function App() {
  // Deep links (e.g. /#menu) mount after the browser's first scroll attempt,
  // so re-apply once fonts and images have settled the layout.
  useEffect(() => {
    const { hash } = window.location
    if (hash.length < 2) return
    const target = document.querySelector(hash)
    if (!target) return
    const jump = () => target.scrollIntoView({ block: 'start', behavior: 'auto' })
    const frame = requestAnimationFrame(jump)
    const timer = setTimeout(jump, 700)
    window.addEventListener('load', jump)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      window.removeEventListener('load', jump)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Menu />
        <Testimonials />
        <Experiences />
      </main>
      <Footer />
    </div>
  )
}

export default App
