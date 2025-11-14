import { NextRequest, NextResponse } from "next/server"

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
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.shorturl) {
        return NextResponse.json({ shortUrl: data.shorturl }, { headers: corsHeaders })
      }
    } catch (error) {
      console.error("Failed to shorten URL:", error)
    }

    return NextResponse.json({ shortUrl: targetUrl }, { headers: corsHeaders })
  } catch (error) {
    console.error("Failed to process URL:", error)
    return NextResponse.json({ shortUrl: originalUrl }, { headers: corsHeaders })
  }
}

