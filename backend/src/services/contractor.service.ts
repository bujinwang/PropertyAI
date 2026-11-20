import { PrismaClient, WorkOrderStatus, DocumentType } from '@prisma/client';
import { triageService } from './triage.service';
import { pushNotificationService } from './pushNotification.service';
const prisma = new PrismaClient();

class ContractorService {
  /**
   * Resolve the `Vendor` row that belongs to an authenticated user.
   *
   * WHY THIS EXISTS
   * ---------------
   * `Vendor` has NO `userId`; the link is `Vendor.contactPersonId -> User.id`,
   * exposed as the `User.Vendor` back-relation. The controller used to read
   * `req.user.vendor.id`, but `authMiddleware.protect` hydrates the user with a
   * bare `findUnique` and no `include`, so that property was always `undefined`
   * and EVERY contractor endpoint crashed into its 500 branch. Worse, the field
   * is capitalised (`User.Vendor`), so even an included relation would not have
   * matched the lowercase read.
   *
   * Resolving here keeps the lookup explicit and correct regardless of what the
   * auth middleware happens to hydrate.
   */
  public async getVendorIdForUser(userId: string): Promise<string | null> {
    const vendor = await prisma.vendor.findUnique({
      where: { contactPersonId: userId },
      select: { id: true },
    });
    return vendor?.id ?? null;
  }

  /** True when this vendor is assigned to the work order. */
  public async isAssigned(workOrderId: string, vendorId: string): Promise<boolean> {
    const assignment = await prisma.workOrderAssignment.findFirst({
      where: { workOrderId, vendorId },
      select: { id: true },
    });
    return !!assignment;
  }

  /**
   * Guard for every by-id work-order operation. Without it any authenticated
   * vendor could accept, re-status, quote, invoice or message ANY work order —
   * the same missing-row-check class of hole as the rental surface.
   */
  public async assertAssigned(workOrderId: string, vendorId: string): Promise<void> {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true },
    });
    if (!workOrder) {
      throw Object.assign(new Error('Work order not found'), { status: 404 });
    }
    if (!(await this.isAssigned(workOrderId, vendorId))) {
      throw Object.assign(new Error('You are not assigned to this work order'), { status: 403 });
    }
  }

  public async getWorkOrders(vendorId: string) {
    return prisma.workOrder.findMany({
      where: { WorkOrderAssignment: { some: { vendorId } } },
      include: { MaintenanceRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getWorkOrderDetails(workOrderId: string, vendorId: string) {
    await this.assertAssigned(workOrderId, vendorId);
    return prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        MaintenanceRequest: { include: { Rental: true } },
        WorkOrderAssignment: { include: { Vendor: true } },
        WorkOrderQuote: true,
      },
    });
  }

  public async acceptWorkOrder(workOrderId: string, vendorId: string) {
    await this.assertAssigned(workOrderId, vendorId);
    return prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: WorkOrderStatus.IN_PROGRESS },
    });
  }

  public async updateWorkOrderStatus(workOrderId: string, vendorId: string, status: WorkOrderStatus) {
    await this.assertAssigned(workOrderId, vendorId);
    return prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status },
    });
  }

  public async submitInvoice(workOrderId: string, invoiceUrl: string, userId: string, vendorId: string) {
    await this.assertAssigned(workOrderId, vendorId);
    const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!workOrder) {
      throw Object.assign(new Error('Work order not found'), { status: 404 });
    }

    return prisma.document.create({
      data: {
        name: `Invoice for Work Order ${workOrderId}`,
        type: DocumentType.INVOICE,
        url: invoiceUrl,
        maintenanceRequestId: workOrder.maintenanceRequestId,
        uploadedById: userId,
      },
    });
  }

  public async declineWorkOrder(workOrderId: string, vendorId: string) {
    // Same guard as every other by-id operation: without it, ANY vendor could
    // unassign and re-triage a work order belonging to someone else.
    await this.assertAssigned(workOrderId, vendorId);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { WorkOrderAssignment: true },
    });

    if (!workOrder) {
      throw Object.assign(new Error('Work order not found'), { status: 404 });
    }

    // Remove only THIS vendor's assignment — other vendors may share the order.
    const assignment = workOrder.WorkOrderAssignment.find((a: any) => a.vendorId === vendorId);
    if (assignment) {
      await prisma.workOrderAssignment.delete({ where: { id: assignment.id } });
    }

    // Set the work order back to OPEN to be re-triaged
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: WorkOrderStatus.OPEN },
    });

    // Re-triage is best-effort: the decline itself has already succeeded
    // (unassigned + reopened), so an AI/NLP failure here must not turn a
    // successful decline into a 500.
    try {
      await triageService.triageRequest(workOrder.maintenanceRequestId);
    } catch (error) {
      console.error('Re-triage after decline failed (decline still applied):', error);
    }
  }

  public async submitQuote(workOrderId: string, vendorId: string, amount: number, details: string) {
    await this.assertAssigned(workOrderId, vendorId);
    return prisma.workOrderQuote.create({
      data: {
        workOrderId,
        vendorId,
        amount,
        details,
      },
    });
  }

  public async getMessages(workOrderId: string, vendorId: string) {
    await this.assertAssigned(workOrderId, vendorId);
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { maintenanceRequestId: true },
    });
    if (!workOrder) {
      throw Object.assign(new Error('Work order not found'), { status: 404 });
    }
    return prisma.message.findMany({
      where: { maintenanceRequestId: workOrder.maintenanceRequestId },
      orderBy: { sentAt: 'asc' },
    });
  }

  public async sendMessage(workOrderId: string, senderId: string, content: string, vendorId: string) {
    await this.assertAssigned(workOrderId, vendorId);
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { MaintenanceRequest: { include: { User: true } } },
    });
    if (!workOrder) {
      throw Object.assign(new Error('Work order not found'), { status: 404 });
    }

    const recipient = workOrder.MaintenanceRequest.User;

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: recipient.id,
        maintenanceRequestId: workOrder.maintenanceRequestId,
        conversationId: `${workOrderId}-${senderId}-${recipient.id}`, // Simple conversation ID
      },
    });

    // Send push notification to the recipient
    if (recipient.pushToken) {
      await pushNotificationService.sendAndroidNotification(
        recipient.pushToken,
        'New Message',
        `You have a new message regarding work order: ${workOrder.title}`
      );
    }

    return message;
  }
}

export const contractorService = new ContractorService();