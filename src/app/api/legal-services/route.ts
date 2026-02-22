import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Free ombudsman services (static data)
const FREE_SERVICES = [
  {
    id: 'legal-ombudsman',
    name: 'Legal Ombudsman',
    description: 'Free help with complaints about lawyers',
    url: 'https://www.legalombudsman.org.uk',
    type: 'free',
    icon: 'shield-checkmark',
  },
  {
    id: 'financial-ombudsman',
    name: 'Financial Ombudsman',
    description: 'Resolve banking & insurance disputes',
    url: 'https://www.financial-ombudsman.org.uk',
    type: 'free',
    icon: 'cash',
  },
  {
    id: 'housing-ombudsman',
    name: 'Housing Ombudsman',
    description: 'Social housing complaints',
    url: 'https://www.housing-ombudsman.org.uk',
    type: 'free',
    icon: 'home',
  },
  {
    id: 'energy-ombudsman',
    name: 'Energy Ombudsman',
    description: 'Gas & electricity disputes',
    url: 'https://www.energyombudsman.org',
    type: 'free',
    icon: 'flash',
  },
  {
    id: 'citizens-advice',
    name: 'Citizens Advice',
    description: 'Free legal guidance for everyone',
    url: 'https://www.citizensadvice.org.uk',
    type: 'free',
    icon: 'people',
  },
];

/**
 * GET /api/legal-services
 * Returns a mixed list of free ombudsman services and active sponsored ads
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Fetch active sponsored services from database
    const sponsoredServices = await prisma.sponsoredLegalService.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          {
            startDate: { lte: now },
            endDate: null,
          },
          {
            startDate: null,
            endDate: { gte: now },
          },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Transform sponsored services to match the frontend format
    const formattedSponsored = sponsoredServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      url: service.url,
      type: 'sponsored' as const,
      icon: service.icon || 'briefcase',
    }));

    // Interleave free services with sponsored ones
    // Strategy: Insert sponsored ad after every 2 free services
    const mixedServices: any[] = [];
    let sponsoredIndex = 0;
    
    FREE_SERVICES.forEach((service, index) => {
      mixedServices.push(service);
      
      // Insert a sponsored ad after every 2 free services
      if ((index + 1) % 2 === 0 && sponsoredIndex < formattedSponsored.length) {
        mixedServices.push(formattedSponsored[sponsoredIndex]);
        sponsoredIndex++;
      }
    });
    
    // Add remaining sponsored services at the end
    while (sponsoredIndex < formattedSponsored.length) {
      mixedServices.push(formattedSponsored[sponsoredIndex]);
      sponsoredIndex++;
    }

    return NextResponse.json({
      services: mixedServices,
      totalFree: FREE_SERVICES.length,
      totalSponsored: formattedSponsored.length,
    });
  } catch (error) {
    console.error('Error fetching legal services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/legal-services/track
 * Track impressions and clicks for sponsored services
 */
export async function POST(request: NextRequest) {
  try {
    const { serviceId, eventType } = await request.json();
    
    if (!serviceId || !['impression', 'click'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Update the appropriate counter
    const updateData = eventType === 'click' 
      ? { clicks: { increment: 1 } }
      : { impressions: { increment: 1 } };

    await prisma.sponsoredLegalService.update({
      where: { id: serviceId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking legal service event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
