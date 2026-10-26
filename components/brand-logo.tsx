import Image from "next/image"
import { brand } from "@/config/brand.config"
import { cn } from "@/lib/utils"

type BrandLogoVariant = "icon" | "wordmark"

interface BrandLogoProps {
  variant?: BrandLogoVariant
  /** Pixel size of the mark. */
  size?: number
  className?: string
  priority?: boolean
}

export function BrandLogo({
  variant = "icon",
  size = 32,
  className,
  priority = false,
}: BrandLogoProps) {
  const mark = (
    <Image
      src={brand.logo.iconSrc}
      alt={variant === "wordmark" ? "" : brand.logo.alt}
      width={size}
      height={size}
      priority={priority}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  )

  if (variant === "wordmark") {
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
        {mark}
        <span
          className="min-w-0 font-[family-name:var(--font-brand)] font-semibold uppercase leading-[1.15] tracking-[0.12em] text-[var(--text-heading)]"
          style={{ fontSize: Math.max(11, Math.round(size * 0.32)) }}
        >
          {brand.productName}
        </span>
      </span>
    )
  }

  return <span className={cn("inline-flex shrink-0", className)}>{mark}</span>
}
