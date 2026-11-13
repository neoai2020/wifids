import { redirect } from "next/navigation"
import { onboardingConfig } from "@/lib/onboarding/config"

export const metadata = {
  title: `Welcome | ${onboardingConfig.productName}`,
}

/** Specialist consultation is hidden. Old links land on the dashboard. */
export default function OnboardingPage() {
  redirect(onboardingConfig.dashboardRoute)
}
