import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"


export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing name or email" }, { status: 400 })
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password
            },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
