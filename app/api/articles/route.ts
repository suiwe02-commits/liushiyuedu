import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/articles - 获取所有文章
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

// POST /api/articles - 创建文章
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, folderId } = body

    const wordCount = content.split(/\s+/).filter((w: string) => w).length

    const article = await prisma.article.create({
      data: {
        title: title || "无标题",
        content,
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
