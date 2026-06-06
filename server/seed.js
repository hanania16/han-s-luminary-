import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_PHOTOS = [
  { id:"p1", title:"Golden Hour",      albumId:"a1", url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", thumb:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", date:"2024-06-15", tags:["nature","sunset"],  likes:12 },
  { id:"p2", title:"City Lights",      albumId:"a1", url:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", thumb:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", date:"2024-07-20", tags:["city","night"],    likes:8  },
  { id:"p3", title:"Morning Fog",      albumId:"a1", url:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", thumb:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", date:"2024-08-01", tags:["mountain","fog"],  likes:23 },
  { id:"p4", title:"Ocean Calm",       albumId:"a2", url:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800", thumb:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400", date:"2024-09-10", tags:["ocean","calm"],    likes:15 },
  { id:"p5", title:"Forest Path",      albumId:"a2", url:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", thumb:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400", date:"2024-10-05", tags:["forest","path"],   likes:19 },
  { id:"p6", title:"Desert Dunes",     albumId:"a2", url:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", thumb:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400", date:"2024-11-12", tags:["desert","travel"],  likes:31 },
  { id:"p7", title:"Starry Night",     albumId:"a3", url:"https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800", thumb:"https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400", date:"2024-12-01", tags:["stars","night"],   likes:44 },
  { id:"p8", title:"Cherry Blossoms",  albumId:"a3", url:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800", thumb:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", date:"2025-03-20", tags:["spring","japan"],   likes:56 },
  { id:"p9", title:"Rainy Window",     albumId:"a3", url:"https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800", thumb:"https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400", date:"2025-01-08", tags:["rain","moody"],    likes:27 },
];

const SEED_ALBUMS = [
  { id:"a1", name:"Me as a Kid",       cover:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", count:3 },
  { id:"a2", name:"My Friends & Me",   cover:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", count:3 },
  { id:"a3", name:"Only Me",           cover:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400", count:3 },
];

const SEED_REQUESTS = [
  { id:"r1", photoId:"p1", photoTitle:"Golden Hour",     name:"Samuel Tesfaye", from:"University friend",   message:"Han, you helped me through my first year at university. This photo reminds me of the evenings we'd study together. You were always the calm I needed.", social:"@samuelT", status:"pending",  date:"2025-06-01T14:32:00Z" },
  { id:"r2", photoId:"p7", photoTitle:"Starry Night",    name:"Meron Alemu",    from:"Childhood neighbor",  message:"I never got the chance to tell you how much your kindness meant to me growing up. We used to stare at the stars from the roof and dream about the future.", social:"@meron_a", status:"approved", approvedAt:new Date("2025-06-02T10:00:00Z"), expiresAt:new Date(Date.now()+12*3600000), date:"2025-06-01T09:15:00Z" },
  { id:"r3", photoId:"p8", photoTitle:"Cherry Blossoms", name:"Abel Girma",     from:"Work colleague",      message:"This photo is stunning, Han. You always had an eye for beauty that most of us walk right past. Thank you for sharing your world with us.", social:"", status:"rejected", date:"2025-05-30T16:45:00Z" },
];

const SEED_MESSAGES = [
  { id:"m1", name:"Samuel Tesfaye", text:"You helped me through my first year at college. I don't think I would have made it without you.", from:"University", date:"2025-06-01" },
  { id:"m2", name:"Meron Alemu",    text:"I never got the chance to say thank you. These photos remind me of our best memories together.", from:"Childhood",  date:"2025-06-01" },
  { id:"m3", name:"Abel Girma",     text:"You always saw the world differently. Thank you for letting us see it through your lens.", from:"Work", date:"2025-05-30" },
];

async function seed() {
  console.log("Seeding database...");

  await prisma.album.createMany({ data: SEED_ALBUMS, skipDuplicates: true });
  console.log("Albums seeded");

  await prisma.photo.createMany({ data: SEED_PHOTOS, skipDuplicates: true });
  console.log("Photos seeded");

  await prisma.request.createMany({ data: SEED_REQUESTS, skipDuplicates: true });
  console.log("Requests seeded");

  await prisma.message.createMany({ data: SEED_MESSAGES, skipDuplicates: true });
  console.log("Messages seeded");

  console.log("Seed complete!");
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
