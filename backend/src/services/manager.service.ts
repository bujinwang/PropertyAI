import { PrismaClient, QuoteStatus, WorkOrderStatus } from '@prisma/client';
import { pushNotificationService } from './pushNotification.service';
const prisma = new PrismaClient();

class ManagerService {
  public async getQuotesForWorkOrder(workOrderId: string) {
    return prisma.workOrderQuote.findMany({
      where: { workOrderId },
      include: { vendor: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async approveQuote(quoteId: string) {
    const quote = await prisma.workOrderQuote.findUnique({
      where: { id: quoteId },
      include: { vendor: { include: { contactPerson: true } } },
    });
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Update the quote status to ACCEPTED
    await prisma.workOrderQuote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.ACCEPTED },
    });

    // Reject all other quotes for this work order
    await prisma.workOrderQuote.updateMany({
      where: {
        workOrderId: quote.workOrderId,
        id: { not: quoteId },
      },
      data: { status: QuoteStatus.REJECTED },
    });

    // Assign the work order to the vendor and update its status
    await prisma.workOrder.update({
      where: { id: quote.workOrderId },
      data: {
        status: WorkOrderStatus.ASSIGNED,
        assignments: {
          create: {
            vendorId: quote.vendorId,
          },
        },
      },
    });

    // Send push notification to the contractor
    if (quote.vendor.contactPerson?.pushToken) {
      await pushNotificationService.sendAndroidNotification(
        quote.vendor.contactPerson.pushToken,
        'Quote Approved!',
        `Your quote for work order "${quote.workOrderId}" has been approved.`
      );
    }
  }

  public async rejectQuote(quoteId: string) {
    return prisma.workOrderQuote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.REJECTED },
    });
  }
}

export const managerService = new ManagerService();