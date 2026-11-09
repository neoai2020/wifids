"use client"

import { useEffect } from "react"

const WIDGET_SRC = "https://cs-app.andrawisnaser.workers.dev/widget.js"
const APP_ID = "Wifi Digital System"
const MOBILE_MQ = "(max-width: 1023px)"
const EXPAND_EVERY_MS = 35000
const EXPAND_FOR_MS = 2800

function paintCloseIcon(btn: HTMLElement) {
  if (btn.dataset.swIcon === "x") return
  btn.dataset.swIcon = "x"
  btn.setAttribute("aria-label", btn.getAttribute("aria-label") || "Close")
  btn.replaceChildren()
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("width", "18")
  svg.setAttribute("height", "18")
  svg.setAttribute("aria-hidden", "true")
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.setAttribute("d", "M6 6l12 12M18 6L6 18")
  path.setAttribute("fill", "none")
  path.setAttribute("stroke", "#fff")
  path.setAttribute("stroke-width", "2.5")
  path.setAttribute("stroke-linecap", "round")
  svg.appendChild(path)
  btn.appendChild(svg)
}

function watchCloseButton() {
  const apply = () => {
    document.querySelectorAll<HTMLElement>(".sw-close").forEach(paintCloseIcon)
  }
  apply()
  const observer = new MutationObserver(apply)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/** Mobile: keep launcher avatar-only; briefly expand on a timer. */
function watchMobileLauncher() {
  const mq = window.matchMedia(MOBILE_MQ)
  let expandTimer: number | null = null
  let collapseTimer: number | null = null
  let observed: HTMLElement | null = null

  const clearTimers = () => {
    if (expandTimer != null) window.clearInterval(expandTimer)
    if (collapseTimer != null) window.clearTimeout(collapseTimer)
    expandTimer = null
    collapseTimer = null
  }

  const collapse = (el: HTMLElement) => {
    el.classList.remove("sw-wifi-expand", "sw-wifi-pop")
  }

  const pulse = (el: HTMLElement) => {
    if (!mq.matches) {
      collapse(el)
      return
    }
    el.classList.add("sw-wifi-expand")
    window.requestAnimationFrame(() => {
      el.classList.add("sw-wifi-pop")
      window.setTimeout(() => el.classList.remove("sw-wifi-pop"), 700)
    })
    if (collapseTimer != null) window.clearTimeout(collapseTimer)
    collapseTimer = window.setTimeout(() => collapse(el), EXPAND_FOR_MS)
  }

  const bind = (el: HTMLElement) => {
    if (observed === el) return
    clearTimers()
    observed = el
    el.classList.add("sw-wifi-mobile")
    collapse(el)
    if (!mq.matches) return
    // First expand shortly after mount, then on an interval.
    collapseTimer = window.setTimeout(() => pulse(el), 1200)
    expandTimer = window.setInterval(() => {
      if (observed) pulse(observed)
    }, EXPAND_EVERY_MS)
  }

  const scan = () => {
    const el = document.querySelector<HTMLElement>(".sw-launcher")
    if (el) bind(el)
  }

  const onMq = () => {
    if (!observed) return
    clearTimers()
    if (mq.matches) {
      bind(observed)
    } else {
      observed.classList.remove("sw-wifi-mobile", "sw-wifi-expand", "sw-wifi-pop")
    }
  }

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  mq.addEventListener("change", onMq)

  return () => {
    clearTimers()
    observer.disconnect()
    mq.removeEventListener("change", onMq)
    observed?.classList.remove("sw-wifi-mobile", "sw-wifi-expand", "sw-wifi-pop")
  }
}

function injectWidget() {
  if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return

  const script = document.createElement("script")
  script.src = WIDGET_SRC
  script.setAttribute("data-app-id", APP_ID)
  script.async = true

  const previous = Object.getOwnPropertyDescriptor(Document.prototype, "currentScript")
  Object.defineProperty(document, "currentScript", {
    configurable: true,
    get: () => script,
  })

  const restore = () => {
    Reflect.deleteProperty(document, "currentScript")
    if (previous) Object.defineProperty(Document.prototype, "currentScript", previous)
  }

  script.addEventListener("load", restore)
  script.addEventListener("error", restore)
  document.body.appendChild(script)
}

/**
 * Loads the live chat widget. The remote script reads document.currentScript for
 * data-app-id, which is null for async/injected scripts — so we polyfill it for
 * the duration of the load. Also replaces the close glyph with a centered SVG X
 * and drives the mobile expand/collapse cycle.
 */
export function SupportChatScript() {
  useEffect(() => {
    injectWidget()
    const stopClose = watchCloseButton()
    const stopMobile = watchMobileLauncher()
    return () => {
      stopClose()
      stopMobile()
    }
  }, [])

  return null
}
