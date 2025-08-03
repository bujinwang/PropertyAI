import { PrismaClient, WorkOrderStatus, DocumentType } from '@prisma/client';
import { triageService } from './triage.service';
import { pushNotificationService } from './pushNotification.service';
const prisma = new PrismaClient();

class ContractorService {
  public async getWorkOrders(vendorId: string) {
    return prisma.workOrder.findMany({
      where: { WorkOrderAssignment: { some: { vendorId } } },
      include: { MaintenanceRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getWorkOrderDetails(workOrderId: string) {
    return prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        MaintenanceRequest: { include: { Rental: true } },
        WorkOrderAssignment: { include: { Vendor: true } },
        WorkOrderQuote: true,
      },
    });
  }

  public async acceptWorkOrder(workOrderId: string) {
    return prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: WorkOrderStatus.IN_PROGRESS },
    });
  }

  public async updateWorkOrderStatus(workOrderId: string, status: WorkOrderStatus) {
    return prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status },
    });
  }

  public async submitInvoice(workOrderId: string, invoiceUrl: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!workOrder) {
      throw new Error('Work order not found');
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
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { WorkOrderAssignment: true },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Remove the current assignment
    const assignment = workOrder.WorkOrderAssignment.find((a: any) => a.vendorId === vendorId);
    if (assignment) {
      await prisma.workOrderAssignment.delete({ where: { id: assignment.id } });
    }

    // Set the work order back to OPEN to be re-triaged
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: WorkOrderStatus.OPEN },
    });

    // Trigger re-triage
    await triageService.triageRequest(workOrder.maintenanceRequestId);
  }

  public async submitQuote(workOrderId: string, vendorId: string, amount: number, details: string) {
    return prisma.workOrderQuote.create({
      data: {
        workOrderId,
        vendorId,
        amount,
        details,
      },
    });
  }

  public async getMessages(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { maintenanceRequestId: true },
    });
    if (!workOrder) {
      throw new Error('Work order not found');
    }
    return prisma.message.findMany({
      where: { maintenanceRequestId: workOrder.maintenanceRequestId },
      orderBy: { sentAt: 'asc' },
    });
  }

  public async sendMessage(workOrderId: string, senderId: string, content: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { MaintenanceRequest: { include: { User: true } } },
    });
    if (!workOrder) {
      throw new Error('Work order not found');
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