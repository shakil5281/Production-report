import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"


export async function GET(req: Request) {
    try {
        const user = await prisma.user.findMany()
        return NextResponse.json({ message: user }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
