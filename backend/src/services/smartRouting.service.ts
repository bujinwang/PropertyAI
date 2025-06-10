import { prisma } from '../config/database';
import { Vendor, WorkOrder, Property, MaintenanceRequestCategory, VendorPerformanceRating } from '@prisma/client';
import vendorPerformanceService from './vendorPerformanceService';

type VendorWithPerformance = Vendor & {
  performanceRatings: VendorPerformanceRating[];
};

type ScoredVendor = Vendor & {
  score: number;
};

// Utility: Haversine distance (km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Placeholder: Load weights from config (admin configurability)
const scoringWeights = {
  performance: 0.3,
  workload: 0.2,
  specialty: 0.1,
  cost: 0.1,
  proximity: 0.1,
  certification: 0.1,
  responseTime: 0.1,
};

// Utility function to calculate vendor workload (number of open assignments)
async function getVendorWorkload(vendorId: string): Promise<number> {
  const openAssignments = await prisma.workOrderAssignment.count({
    where: {
      vendorId,
      workOrder: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      },
    },
  });
  return openAssignments;
}

// Utility function to calculate vendor score
async function scoreVendor(vendor: Vendor, workOrder: any): Promise<number> {
  const v = vendor as Vendor & {
    standardRate?: number;
    latitude?: number;
    longitude?: number;
    certifications?: string[];
  };
  // 1. Performance (average rating)
  const performanceScore = await vendorPerformanceService.getAverageScoreForVendor(v.id);
  // 2. Workload (fewer open assignments = higher score)
  const workload = await getVendorWorkload(v.id);
  const workloadScore = workload > 0 ? 1 / workload : 1;
  // 3. Specialty match
  let specialtyScore = 0;
  if (
    workOrder.maintenanceRequest &&
    workOrder.maintenanceRequest.categoryId &&
    v.specialty
  ) {
    specialtyScore = v.specialty === workOrder.maintenanceRequest.categoryId ? 1 : 0;
  }
  // 4. Cost (lower is better)
  let costScore = 1;
  if (v.standardRate !== undefined && v.standardRate !== null) {
    costScore = 1 - Math.min(v.standardRate / 100, 1);
  }
  // 5. Proximity (closer is better)
  let proximityScore = 1;
  if (
    v.latitude !== undefined && v.longitude !== undefined &&
    workOrder.maintenanceRequest?.property?.latitude !== undefined &&
    workOrder.maintenanceRequest?.property?.longitude !== undefined
  ) {
    const distance = haversineDistance(
      v.latitude, v.longitude,
      workOrder.maintenanceRequest.property.latitude,
      workOrder.maintenanceRequest.property.longitude
    );
    proximityScore = Math.max(0, 1 - distance / 50); // <10km=1, >50km=0
  }
  // 6. Certification (bonus if required)
  let certificationScore = 0;
  const requiredCert = workOrder.maintenanceRequest?.category?.requiredCertification;
  if (requiredCert && Array.isArray(v.certifications) && v.certifications.includes(requiredCert)) {
    certificationScore = 1;
  }
  // 7. Response time (placeholder)
  let responseTimeScore = 1;

  // Weighted sum (weights can be loaded from config)
  const score =
    scoringWeights.performance * performanceScore +
    scoringWeights.workload * workloadScore +
    scoringWeights.specialty * specialtyScore +
    scoringWeights.cost * costScore +
    scoringWeights.proximity * proximityScore +
    scoringWeights.certification * certificationScore +
    scoringWeights.responseTime * responseTimeScore;
  return score;
}

class SmartRoutingService {
  public async findBestVendor(workOrderId: string): Promise<Vendor | null> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        maintenanceRequest: {
          include: {
            property: true,
            category: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const { maintenanceRequest } = workOrder;
    const property = maintenanceRequest.property;
    const category = maintenanceRequest.category;

    if (!property || !category) {
      throw new Error('Property or category not found for work order');
    }

    const availableVendors = await prisma.vendor.findMany({
      where: {
        availability: 'AVAILABLE',
        specialty: category.name,
        serviceAreas: {
          has: property.zipCode,
        },
      },
      include: {
        // Assuming a relation `performanceRatings` exists on the Vendor model
        // If not, this will need to be adjusted based on the actual schema.
        // Let's assume for now that it needs to be fetched separately or the schema is different.
        // For the purpose of this code, I'll proceed as if I need to fetch it.
      },
    });

    if (availableVendors.length === 0) {
      return null;
    }

    const vendorsWithPerformance = await Promise.all(
      availableVendors.map(async (vendor) => {
        const performanceRatings = await prisma.vendorPerformanceRating.findMany({
          where: { vendorId: vendor.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        return { ...vendor, performanceRatings };
      })
    );

    const scoredVendors = await Promise.all(
        vendorsWithPerformance.map(async (vendor) => {
        const score = await scoreVendor(vendor, workOrder);
        return { ...vendor, score };
      })
    );

    scoredVendors.sort((a, b) => b.score - a.score);

    return scoredVendors.length > 0 ? scoredVendors[0] : null;
  }

  async routeWorkOrder(workOrderId: string): Promise<any> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        maintenanceRequest: {
          include: {
            property: true,
            category: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Enhanced filtering: specialty, service area, availability
    let contractors = [];
    if (
      workOrder.maintenanceRequest &&
      workOrder.maintenanceRequest.categoryId &&
      workOrder.maintenanceRequest.property?.zipCode
    ) {
      contractors = await prisma.vendor.findMany({
        where: {
          specialty: workOrder.maintenanceRequest.categoryId,
          availability: 'AVAILABLE',
          serviceAreas: {
            has: workOrder.maintenanceRequest.property.zipCode,
          },
        },
      });
    } else {
      contractors = await prisma.vendor.findMany({
        where: { availability: 'AVAILABLE' },
      });
    }

    if (contractors.length === 0) {
      return { status: 'escalated', reason: 'No suitable contractors found' };
    }

    // Score each contractor
    const contractorScores: ScoredVendor[] = [];
    for (const contractor of contractors) {
      const score = await scoreVendor(contractor, workOrder);
      contractorScores.push({ ...contractor, score });
    }

    contractorScores.sort((a, b) => b.score - a.score);
    const bestContractor = contractorScores[0];

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: 'ASSIGNED',
        assignments: {
          create: {
            vendorId: bestContractor.id,
          },
        },
      },
    });

    // Placeholder: Send notifications to contractor and manager
    // await notificationService.send({ ... })

    return { status: 'assigned', contractor: bestContractor };
  }
}

export const smartRoutingService = new SmartRoutingService();
