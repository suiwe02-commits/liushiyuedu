import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/articles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const articles = await prisma.article.findMany({
      where: { userId: session.user.id },
      include: { folder: true },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error("GET articles error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/articles
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, folderId } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const wordCount = content.length

    const article = await prisma.article.create({
      data: {
        title: (title || content.trim().substring(0, 50) || "无标题").trim(),
        content: content.trim(),
        wordCount,
        userId: session.user.id,
        folderId: folderId || null,
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error("POST article error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
