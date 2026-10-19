import { EXCLUSIVE_OFFER_ICONS, type ExclusiveOffer } from "@/config/offers.config"
import type { PromoLinksSettings } from "@/lib/promo-links"

export type CatalogGroup = "sidebar" | "popup" | "banner" | "other"

export interface CatalogItem {
  id: string
  group: CatalogGroup
  name: string
  removable: boolean
  enabled: boolean
  title: string
  subtitle: string
  body: string
  ctaLabel: string
  href: string
  note: string
  vturbPlayerId: string
  vturbScriptSrc: string
  phoneDisplay: string
  phoneTel: string
}

export interface PromoCatalog {
  schemaVersion: 1
  sidebarEnabled: boolean
  addGroups: CatalogGroup[]
  items: CatalogItem[]
}

const GROUPS = new Set<CatalogGroup>(["sidebar", "popup", "banner", "other"])
const FIXED_IDS = ["banner-training", "banner-video-withdraw", "banner-scale"] as const

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function blank(partial: Pick<CatalogItem, "id" | "group" | "name"> & Partial<CatalogItem>): CatalogItem {
  return {
    removable: false,
    enabled: true,
    title: "",
    subtitle: "",
    body: "",
    ctaLabel: "",
    href: "",
    note: "",
    vturbPlayerId: "",
    vturbScriptSrc: "",
    phoneDisplay: "",
    phoneTel: "",
    ...partial,
  }
}

export function promoSettingsToCatalog(settings: PromoLinksSettings): PromoCatalog {
  const items: CatalogItem[] = settings.exclusiveOffers.map((offer, index) =>
    blank({
      id: `sidebar-${index + 1}`,
      group: "sidebar",
      name: `Sidebar link ${index + 1}`,
      removable: true,
      title: offer.title,
      subtitle: offer.cta ?? "",
      ctaLabel: offer.cta ?? "",
      href: offer.href,
    }),
  )

  items.push(
    blank({
      id: "banner-training",
      group: "banner",
      name: "Free training banner",
      title: settings.externalTrainingTitle,
      ctaLabel: settings.externalTrainingCtaLabel,
      href: settings.externalTrainingUrl,
    }),
    blank({
      id: "banner-video-withdraw",
      group: "banner",
      name: "Video withdraw link",
      href: settings.videoWithdrawUrl,
    }),
    blank({
      id: "banner-scale",
      group: "banner",
      name: "Scale training",
      title: settings.scaleTrainingTitle,
      ctaLabel: settings.scaleTrainingCtaLabel,
      href: settings.scaleTrainingUrl,
    }),
  )

  return { schemaVersion: 1, sidebarEnabled: settings.exclusiveOffersEnabled, addGroups: ["sidebar"], items }
}

export function readCatalog(value: unknown): PromoCatalog {
  if (!value || typeof value !== "object") throw new Error("Invalid catalog.")
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.items)) throw new Error("Catalog items are missing.")

  const items = raw.items.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Item ${index + 1} is invalid.`)
    const row = entry as Record<string, unknown>
    const group = row.group
    if (typeof group !== "string" || !GROUPS.has(group as CatalogGroup)) {
      throw new Error(`Item ${index + 1} has an invalid group.`)
    }
    const id = text(row.id)
    if (!id) throw new Error(`Item ${index + 1} is missing an id.`)
    return blank({
      id,
      group: group as CatalogGroup,
      name: text(row.name) || id,
      removable: row.removable === true,
      enabled: row.enabled !== false,
      title: text(row.title),
      subtitle: text(row.subtitle),
      body: text(row.body),
      ctaLabel: text(row.ctaLabel),
      href: text(row.href),
      note: text(row.note),
      vturbPlayerId: text(row.vturbPlayerId),
      vturbScriptSrc: text(row.vturbScriptSrc),
      phoneDisplay: text(row.phoneDisplay),
      phoneTel: text(row.phoneTel),
    })
  })

  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate item id: ${item.id}`)
    ids.add(item.id)
  }

  return { schemaVersion: 1, sidebarEnabled: raw.sidebarEnabled !== false, addGroups: ["sidebar"], items }
}

export function catalogToPromoSettings(catalog: PromoCatalog, current: PromoLinksSettings): PromoLinksSettings {
  const byId = new Map(catalog.items.map((item) => [item.id, item]))
  for (const id of FIXED_IDS) {
    if (!byId.has(id)) throw new Error(`Missing required item: ${id}`)
  }
  const unknown = catalog.items.filter(
    (item) => item.group !== "sidebar" && !FIXED_IDS.includes(item.id as (typeof FIXED_IDS)[number]),
  )
  if (unknown.length > 0) {
    throw new Error("This app only allows adding or removing sidebar links. Edit the existing banners.")
  }

  const training = byId.get("banner-training")!
  const withdraw = byId.get("banner-video-withdraw")!
  const scale = byId.get("banner-scale")!
  const sidebar = catalog.items.filter((item) => item.group === "sidebar")

  const exclusiveOffers: ExclusiveOffer[] = sidebar.map((item, index) => ({
    title: item.title,
    href: item.href,
    cta: item.ctaLabel || item.subtitle,
    icon: current.exclusiveOffers[index]?.icon ?? EXCLUSIVE_OFFER_ICONS[index % EXCLUSIVE_OFFER_ICONS.length],
  }))

  return {
    exclusiveOffersEnabled: catalog.sidebarEnabled,
    exclusiveOffers,
    externalTrainingUrl: training.href,
    externalTrainingTitle: training.title,
    externalTrainingCtaLabel: training.ctaLabel,
    videoWithdrawUrl: withdraw.href,
    scaleTrainingUrl: scale.href,
    scaleTrainingTitle: scale.title,
    scaleTrainingCtaLabel: scale.ctaLabel,
  }
}
