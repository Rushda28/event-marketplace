import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// 1. Set up the native pg Connection Pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Instantiate the Prisma 7 Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Feed the adapter directly into the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("实时 🧹 Cleaning up old database records...");
  await prisma.booking.deleteMany({});
  await prisma.event.deleteMany({});

  console.log("🌱 Seeding marketplace events...");

  const events = [
    {
      title: "Tech Innovators Summit 2026",
      description: "Join industry leaders as they explore the future of AI, decentralized architectures, and full-stack engineering ecosystems.",
      category: "Technology",
      location: "Grand Ballroom, Colombo",
      date: new Date("2026-08-15T09:00:00Z"),
      price: 2500,
      totalCapacity: 150,
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"
    },
    {
      title: "Acoustic Sunsets Beach Session",
      description: "An evening of live unplugged soul, indie-pop, and ambient melodies right by the crashing ocean waves.",
      category: "Music",
      location: "Coastal Shoreline Lounge, Mount Lavinia",
      date: new Date("2026-07-20T16:30:00Z"),
      price: 1500,
      totalCapacity: 80,
      imageUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=60"
    },
    {
      title: "UI/UX Craftsmanship Workshop",
      description: "A hands-on intensive masterclass targeting production layouts, interactive design tokens, and modern user experience components.",
      category: "Design",
      location: "Innovation Hub Labs, Colombo",
      date: new Date("2026-09-05T10:00:00Z"),
      price: 3000,
      totalCapacity: 40,
      imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60"
    }
  ];

  for (const event of events) {
    const createdEvent = await prisma.event.create({
      data: event,
    });
    console.log(`✅ Created event: "${createdEvent.title}"`);
  }

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Cleanly close the pool connection
  });