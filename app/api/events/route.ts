import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/events - Fetch all marketplace events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("API Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create a new event manually
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, location, date, price, totalCapacity, imageUrl } = body;

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        category,
        location,
        date: new Date(date),
        price: Number(price),
        totalCapacity: Number(totalCapacity),
        imageUrl,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("API Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}