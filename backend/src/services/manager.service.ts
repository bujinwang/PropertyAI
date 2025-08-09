import { PrismaClient, QuoteStatus, WorkOrderStatus } from '@prisma/client';
import { pushNotificationService } from './pushNotification.service';
const prisma = new PrismaClient();

class ManagerService {
  public async getQuotesForWorkOrder(workOrderId: string) {
    return prisma.workOrderQuote.findMany({
      where: { workOrderId },
      include: { Vendor: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async approveQuote(quoteId: string) {
    const quote = await prisma.workOrderQuote.findUnique({
      where: { id: quoteId },
      include: { 
        Vendor: { 
          include: { 
            User: true // Assuming vendor has a User relation for contact info
          } 
        } 
      },
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

    // Create work order assignment and update status
    await prisma.workOrderAssignment.create({
      data: {
        workOrderId: quote.workOrderId,
        vendorId: quote.vendorId,
      },
    });

    // Update work order status
    await prisma.workOrder.update({
      where: { id: quote.workOrderId },
      data: { status: WorkOrderStatus.ASSIGNED },
    });

    // Send push notification to the contractor (if they have push token)
    // Note: This assumes vendor has a User relation with push token
    if (quote.Vendor.User?.pushToken) {
      await pushNotificationService.sendAndroidNotification(
        quote.Vendor.User.pushToken,
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