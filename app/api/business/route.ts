import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const uniqueSlug = `${body.slug}-${Math.random().toString(36).substring(2, 8)}`;

    const business = await prisma.business.create({
      data: {
        name: body.name,
        googleLink: body.googleLink,
        slug: uniqueSlug,
        userId,
        qrCodes: {
          create: {}
        }
      },
    });

    return NextResponse.json(business);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name } = await req.json();

    const updatedBusiness = await prisma.business.update({
      where: { id, userId },
      data: { name }
    });

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}