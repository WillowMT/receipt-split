import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  let originalUrl = ""

  try {
    const body = await request.json()
    const { url } = body
    originalUrl = url || ""

    if (!url || typeof url !== "string") {
      return NextResponse.json({ shortUrl: originalUrl }, { headers: corsHeaders })
    }

    let targetUrl = url
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      let data

      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("Failed to parse response:", text)
        throw new Error("Invalid JSON response")
      }

      if (data && data.shorturl) {
        return NextResponse.json({ shortUrl: data.shorturl }, { headers: corsHeaders })
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Request timeout")
      } else {
        console.error("Failed to shorten URL:", error)
      }
    }

    return NextResponse.json({ shortUrl: targetUrl }, { headers: corsHeaders })
  } catch (error) {
    console.error("Failed to process URL:", error)
    return NextResponse.json({ shortUrl: originalUrl }, { headers: corsHeaders })
  }
}

