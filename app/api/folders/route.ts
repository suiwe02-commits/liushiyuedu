import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/folders - 获取所有文件夹
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error("GET folders error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/folders - 创建文件夹
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId } = body

    const count = await prisma.folder.count({
      where: { userId: session.user.id, parentId: parentId || null }
    })

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        sortOrder: count,
        userId: session.user.id,
      }
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error("POST folder error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
