import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  let originalUrl = ""

  try {
    const { url } = await request.json()
    originalUrl = url || ""

    if (!url || typeof url !== "string") {
      return NextResponse.json({ shortUrl: originalUrl })
    }

    let targetUrl = url
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`
    }

    try {
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`)
      const data = await response.json()

      if (data.shorturl) {
        return NextResponse.json({ shortUrl: data.shorturl })
      }
    } catch (error) {
      console.error("Failed to shorten URL:", error)
    }

    return NextResponse.json({ shortUrl: targetUrl })
  } catch (error) {
    console.error("Failed to process URL:", error)
    return NextResponse.json({ shortUrl: originalUrl })
  }
}

