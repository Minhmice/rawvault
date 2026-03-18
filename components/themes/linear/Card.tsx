"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

export interface LinearCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

/**
 * LINEAR Card animation personality:
 *  - Deep multi-layer shadows + inset top highlight
 *  - Spotlight mouse-tracking effect inside a pseudo-container
 *  - Subtle border brighten on hover, expo-out easing (small translation)
 */
const LinearCard = React.forwardRef<HTMLDivElement, LinearCardProps>(
  ({ className, glass, children, ...props }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }

      const card = cardRef.current
      if (card) {
        card.addEventListener('mousemove', handleMouseMove)
        card.addEventListener('mouseenter', () => setIsHovered(true))
        card.addEventListener('mouseleave', () => setIsHovered(false))
      }

      return () => {
        if (card) {
          card.removeEventListener('mousemove', handleMouseMove)
          card.removeEventListener('mouseenter', () => setIsHovered(true))
          card.removeEventListener('mouseleave', () => setIsHovered(false))
        }
      }
    }, [])

    return (
      <div 
        ref={cardRef} 
        className={cn(
          "relative group rounded-[var(--rv-radius-lg)] overflow-hidden",
          "[transition:transform_300ms_cubic-bezier(0.16,1,0.3,1),box-shadow_300ms_cubic-bezier(0.16,1,0.3,1)]",
          "hover:-translate-y-1",
          // Multi-layer base shadow
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]",
          // Hover shadow with accent glow
          "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_color-mix(in_oklab,var(--rv-primary),transparent_90%),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
          "animate-enter",
          className
        )}
        {...props}
      >
        {/* Mouse spotlight effect */}
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, color-mix(in_oklab,var(--rv-primary),transparent 92%), transparent 40%)`
          }}
        />
        
        {/* Inner Card content container */}
        <div className={cn(
          "relative z-10 w-full h-full bg-[var(--rv-surface)] p-0 m-0 border-none transition-colors duration-300 group-hover:bg-[var(--rv-surface-hover)]",
          glass && "backdrop-blur-xl bg-rv-surface/60 group-hover:bg-rv-surface-hover/70"
        )}>
          {children}
        </div>
      </div>
    )
  }
)
LinearCard.displayName = "LinearCard"

export { LinearCard }
