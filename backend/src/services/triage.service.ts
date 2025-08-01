import { Prisma, PrismaClient, MaintenanceRequest, EmergencyRoutingRule, Priority } from '@prisma/client';
import { sentimentService } from './sentiment.service';
import { nlpService } from './nlp.service';
import { communicationService } from './communication.service';
import { costEstimationService } from './costEstimation.service';

const prisma = new PrismaClient();

type EmergencyRoutingRuleWithVendor = Prisma.EmergencyRoutingRuleGetPayload<{
  include: { vendor: true };
}>;

class TriageService {
  public async triageRequest(requestId: string): Promise<void> {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { requestedBy: true },
    });

    if (!request) {
      console.error(`Maintenance request with ID ${requestId} not found.`);
      return;
    }

    // 1. Analyze sentiment and content
    const sentiment = await sentimentService.analyze(request.description);
    const { priority, category } = await nlpService.extractDetails(request.description);

    // Update request with analyzed data
    await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: { priority: priority as Priority, category: { connectOrCreate: { where: { name: category }, create: { name: category } } } },
    });

    // 2. Apply routing rules
    const rule = await this.findMatchingRule(category, priority);

    if (rule) {
      // 3. Execute action based on rule
      await this.executeAction(rule, request);
    } else {
      // Default action if no rule matches
      await this.assignToDefaultQueue(request);
    }
  }

  private async findMatchingRule(category: string, priority: string): Promise<EmergencyRoutingRuleWithVendor | null> {
    return prisma.emergencyRoutingRule.findFirst({
      where: {
        priority: priority as Priority,
      },
      include: { vendor: true },
    });
  }

  private async executeAction(rule: EmergencyRoutingRuleWithVendor, request: MaintenanceRequest & { requestedBy: any }) {
    console.log(`Executing rule: ${rule.id} for request: ${request.id}`);
    if (rule.vendor) {
      // Assign to vendor and notify
      const newWorkOrder = await prisma.workOrder.create({
        data: {
          title: request.title,
          description: request.description,
          priority: request.priority,
          maintenanceRequest: { connect: { id: request.id } },
          assignments: {
            create: {
              vendor: { connect: { id: rule.vendor.id } },
            },
          },
        },
      });

      // Trigger AI cost estimation
      await costEstimationService.estimateCost(newWorkOrder.id);

      if (rule.vendor.phone) {
        await communicationService.sendSms(rule.vendor.phone, `New work order assigned: ${request.title}`);
      }
    }
  }

  private async assignToDefaultQueue(request: MaintenanceRequest) {
    console.log(`No specific rule found. Assigning request ${request.id} to default queue.`);
    // Logic to assign to a general maintenance queue for manual review
    await prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: 'OPEN' }, // Ensure it's marked for review
    });
  }
}

export const triageService = new TriageService();