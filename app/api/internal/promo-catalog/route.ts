import { NextResponse } from "next/server"
import { controlPlaneAuthError } from "@/lib/control-plane-auth"
import { catalogToPromoSettings, promoSettingsToCatalog, readCatalog } from "@/lib/control-plane-catalog"
import { validatePromoLinksSettings } from "@/lib/promo-links"
import { fetchPromoLinksFromDb, upsertPromoLinksToDb } from "@/lib/promo-links-server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const denied = controlPlaneAuthError(request)
  if (denied) return denied

  const settings = await fetchPromoLinksFromDb()
  return NextResponse.json(promoSettingsToCatalog(settings))
}

export async function PUT(request: Request) {
  const denied = controlPlaneAuthError(request)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const current = await fetchPromoLinksFromDb()
    const catalog = readCatalog(body)
    const settings = catalogToPromoSettings(catalog, current)
    const validationError = validatePromoLinksSettings(settings)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
    await upsertPromoLinksToDb(settings)
    return NextResponse.json(promoSettingsToCatalog(settings))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save catalog."
    const status = /schema|does not exist|column/i.test(message) ? 500 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
