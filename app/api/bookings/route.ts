import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, email, quantity } = body;

    const ticketCount = Number(quantity) || 1;

    if (!eventId || !email || ticketCount < 1) {
      return NextResponse.json({ error: "Missing required fields or invalid quantity" }, { status: 400 });
    }

    // Run within a safe database transaction
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if requested quantity exceeds remaining capacity
      if (event.ticketsSold + ticketCount > event.totalCapacity) {
        throw new Error("NOT_ENOUGH_SEATS");
      }

      // Loop and create an individual booking record for each pass requested
      const bookings = [];
      for (let i = 0; i < ticketCount; i++) {
        const booking = await tx.booking.create({
          data: { 
            eventId, 
            email: email.trim().toLowerCase() // FORCE LOWERCASE HERE
          },
        });
        bookings.push(booking);
      }

      // Increment tickets sold count safely by the exact quantity
      await tx.event.update({
        where: { id: eventId },
        data: { ticketsSold: { increment: ticketCount } },
      });

      return bookings;
    });

    return NextResponse.json({ success: true, bookings: result }, { status: 201 });
  } catch (error: any) {
    console.error("Booking transactional error:", error);
    
    if (error.message === "NOT_ENOUGH_SEATS") {
      return NextResponse.json({ error: "Not enough tickets available for this request!" }, { status: 400 });
    }
    return NextResponse.json({ error: "Booking processing failed" }, { status: 500 });
  }
}