import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Only import Prisma at runtime, not during build
        const { prisma } = await import("@/lib/db/prisma")
        const user = await prisma.user.findMany()
        return NextResponse.json({ message: user }, { status: 200 })
    } catch (error) {
        console.error('Sign-in API error:', error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
