import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import prisma from "@calcom/prisma";

// GET /api/locations - List all clinic locations
async function getLocationsHandler() {
  const legacyReq = buildLegacyRequest(await headers(), await cookies());
  const session = await getServerSession({ req: legacyReq });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Find teams/locations where user is a member
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          eventTypes: {
            select: {
              id: true,
              title: true,
              slug: true,
              length: true,
              price: true,
              currency: true,
            },
          },
        },
      },
    },
  });

  const locations = memberships.map((m) => {
    const team = m.team;
    const metadata = (team.metadata as Record<string, any>) || {};
    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      bio: team.bio,
      logoUrl: team.logoUrl,
      role: m.role,
      address: metadata.address || "",
      phoneNumber: metadata.phoneNumber || "",
      stripeConfigured: !!(metadata.stripePublishableKey && metadata.stripeSecretKey),
      stripePublishableKey: metadata.stripePublishableKey || "",
      defaultDepositInGbp: metadata.defaultDepositInGbp || 30,
      members: team.members.map((mem) => ({
        id: mem.user.id,
        name: mem.user.name,
        email: mem.user.email,
        role: mem.role,
        avatarUrl: mem.user.avatarUrl,
      })),
      eventTypes: team.eventTypes,
      bookingUrl: `${process.env.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3000"}/${team.slug}`,
    };
  });

  return NextResponse.json({ locations });
}

// POST /api/locations - Create a new clinic location
async function createLocationHandler(req: Request) {
  const legacyReq = buildLegacyRequest(await headers(), await cookies());
  const session = await getServerSession({ req: legacyReq });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    slug,
    address,
    phoneNumber,
    stripePublishableKey,
    stripeSecretKey,
    stripeWebhookSecret,
    defaultDepositInGbp,
  } = body;

  if (!name || !slug) {
    return NextResponse.json({ message: "Location name and slug are required" }, { status: 400 });
  }

  // Format slug cleanly
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  // Check if slug is taken
  const existingTeam = await prisma.team.findFirst({
    where: { slug: cleanSlug },
  });

  if (existingTeam) {
    return NextResponse.json({ message: "A clinic location with this URL slug already exists" }, { status: 400 });
  }

  // Create Team with metadata
  const location = await prisma.team.create({
    data: {
      name,
      slug: cleanSlug,
      timeZone: "Europe/London",
      metadata: {
        address: address || "",
        phoneNumber: phoneNumber || "",
        stripePublishableKey: stripePublishableKey || "",
        stripeSecretKey: stripeSecretKey || "",
        stripeWebhookSecret: stripeWebhookSecret || "",
        defaultDepositInGbp: Number(defaultDepositInGbp) || 30,
      },
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          accepted: true,
        },
      },
      // Create initial UK Dental treatment templates for this branch
      eventTypes: {
        create: [
          {
            title: "Direct Access Dental Hygiene",
            slug: "hygiene",
            length: 45,
            description: "45-minute comprehensive scaling, polishing, and periodontal care.",
            price: 3000, // £30.00 deposit
            currency: "gbp",
            userId: session.user.id,
            bookingFields: [
              {
                name: "medicalHistory",
                type: "textarea",
                label: "Any medical conditions, allergies, or blood-thinning medications?",
                required: true,
              },
              {
                name: "emergencyTriage",
                type: "select",
                label: "Are you experiencing acute dental pain or facial swelling?",
                options: ["No - Routine", "Mild discomfort (1-3)", "Moderate pain (4-6)", "Severe pain (7-10)"],
                required: true,
              },
              {
                name: "cqcConsent",
                type: "checkbox",
                label: "I confirm my medical disclosures are accurate and agree to the 24h deposit cancellation policy.",
                required: true,
              },
            ],
          },
          {
            title: "Private Dental Examination & Checkup",
            slug: "private-checkup",
            length: 30,
            description: "Full clinical examination, oral cancer screening, and digital X-rays.",
            price: 2500, // £25.00 deposit
            currency: "gbp",
            userId: session.user.id,
          },
          {
            title: "Emergency Toothache Triage",
            slug: "emergency-triage",
            length: 30,
            description: "Same-day priority emergency pain relief and clinical diagnostic slot.",
            price: 5000, // £50.00 deposit
            currency: "gbp",
            userId: session.user.id,
          },
        ],
      },
    },
  });

  return NextResponse.json({ success: true, location });
}

export const GET = defaultResponderForAppDir(getLocationsHandler);
export const POST = defaultResponderForAppDir(createLocationHandler);
