import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Bulk update status
router.put('/bulk/status', authenticateToken, async (req, res) => {
  try {
    const { reviewIds, status } = req.body;
    
    if (!Array.isArray(reviewIds) || !reviewIds.length) {
      return res.status(400).json({ error: 'reviewIds must be a non-empty array' });
    }

    const updated = await prisma.uXReview.updateMany({
      where: { id: { in: reviewIds } },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    // Create notifications for affected users
    const reviews = await prisma.uXReview.findMany({
      where: { id: { in: reviewIds } },
      include: { assignments: { include: { assignee: true } } }
    });

    for (const review of reviews) {
      for (const assignment of review.assignments) {
        await prisma.notification.create({
          data: {
            userId: assignment.assigneeId,
            type: 'UX_REVIEW_UPDATE',
            message: `UX Review "${review.title}" status updated to ${status}`,
            link: `/ux-reviews/${review.id}`
          }
        });
      }
    }

    res.json({ 
      success: true, 
      updatedCount: updated.count,
      message: `${updated.count} reviews updated to ${status}`
    });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: 'Failed to update review statuses' });
  }
});

// Bulk assign reviews
router.put('/bulk/assign', authenticateToken, authorize(['ADMIN', 'PROPERTY_MANAGER']), async (req, res) => {
  try {
    const { reviewIds, assigneeId } = req.body;
    
    if (!Array.isArray(reviewIds) || !reviewIds.length) {
      return res.status(400).json({ error: 'reviewIds must be a non-empty array' });
    }

    const assignments = [];
    for (const reviewId of reviewIds) {
      const assignment = await prisma.uXReviewAssignment.upsert({
        where: {
          reviewId_assigneeId: {
            reviewId,
            assigneeId
          }
        },
        update: {
          status: 'PENDING',
          updatedAt: new Date()
        },
        create: {
          reviewId,
          assigneeId,
          status: 'PENDING'
        }
      });
      assignments.push(assignment);
    }

    // Create notifications for assignee
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { firstName: true, lastName: true, email: true }
    });

    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'UX_REVIEW_ASSIGNED',
        message: `You have been assigned ${reviewIds.length} UX reviews`,
        link: '/ux-reviews'
      }
    });

    res.json({ 
      success: true, 
      assignedCount: assignments.length,
      assigneeName: `${assignee?.firstName} ${assignee?.lastName}`,
      message: `${assignments.length} reviews assigned to ${assignee?.firstName} ${assignee?.lastName}`
    });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({ error: 'Failed to assign reviews' });
  }
});

// Bulk delete reviews
router.delete('/bulk', authenticateToken, authorize(['ADMIN']), async (req, res) => {
  try {
    const { reviewIds } = req.body;
    
    if (!Array.isArray(reviewIds) || !reviewIds.length) {
      return res.status(400).json({ error: 'reviewIds must be a non-empty array' });
    }

    // Soft delete by updating status
    const deleted = await prisma.uXReview.updateMany({
      where: { id: { in: reviewIds } },
      data: { 
        status: 'ARCHIVED',
        updatedAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      deletedCount: deleted.count,
      message: `${deleted.count} reviews archived`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to archive reviews' });
  }
});

// Bulk export reviews
router.post('/bulk/export', authenticateToken, async (req, res) => {
  try {
    const { reviewIds, format = 'json' } = req.body;
    
    if (!Array.isArray(reviewIds) || !reviewIds.length) {
      return res.status(400).json({ error: 'reviewIds must be a non-empty array' });
    }

    const reviews = await prisma.uXReview.findMany({
      where: { id: { in: reviewIds } },
      include: {
        reviewer: {
          select: { firstName: true, lastName: true, email: true }
        },
        assignments: {
          include: {
            assignee: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    let exportData;
    let filename;

    switch (format) {
      case 'csv':
        exportData = convertToCSV(reviews);
        filename = `ux-reviews-${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        break;
      case 'pdf':
        exportData = await convertToPDF(reviews);
        filename = `ux-reviews-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        break;
      default:
        exportData = JSON.stringify(reviews, null, 2);
        filename = `ux-reviews-${Date.now()}.json`;
        res.setHeader('Content-Type', 'application/json');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({ error: 'Failed to export reviews' });
  }
});

// Helper function to convert to CSV
function convertToCSV(reviews: any[]) {
  const headers = [
    'Title',
    'Description',
    'Status',
    'Priority',
    'Component Type',
    'Reviewer',
    'Created At',
    'Updated At'
  ];

  const rows = reviews.map(review => [
    review.title,
    review.description || '',
    review.status,
    review.priority,
    review.componentType,
    `${review.reviewer.firstName} ${review.reviewer.lastName}`,
    review.createdAt,
    review.updatedAt
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// Helper function to convert to PDF (simplified - would use PDF library)
async function convertToPDF(reviews: any[]) {
  // In a real implementation, use a PDF generation library like pdfkit
  const pdfContent = {
    title: 'UX Reviews Export',
    date: new Date().toISOString(),
    count: reviews.length,
    reviews: reviews.map(review => ({
      title: review.title,
      description: review.description,
      status: review.status,
      priority: review.priority,
      componentType: review.componentType,
      reviewer: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }))
  };

  return JSON.stringify(pdfContent, null, 2);
}

export default router;