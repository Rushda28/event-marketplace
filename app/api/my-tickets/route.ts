import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/my-tickets - Fetch all bookings for a specific email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Fetch bookings matching email and join relevant event parameters
    const userBookings = await prisma.booking.findMany({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(userBookings);
  } catch (error) {
    console.error("API Error fetching user tickets:", error);
    return NextResponse.json({ error: "Failed to retrieve tickets" }, { status: 500 });
  }
}