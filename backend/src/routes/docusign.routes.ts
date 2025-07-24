import { Router } from 'express';
import { docuSignService } from '../services/docusign.service';
import { authenticateToken } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';

const router = Router();

// Get DocuSign authorization URL
router.get('/auth', authenticateToken, async (req, res) => {
  try {
    const authUrl = docuSignService.getAuthUrl();
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating DocuSign auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

// Handle DocuSign OAuth callback
router.get('/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code'
      });
    }

    await docuSignService.handleCallback(code as string);
    
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=true`);
  } catch (error) {
    console.error('Error handling DocuSign callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=auth_failed`);
  }
});

// Create lease envelope
router.post('/lease/:leaseId', authenticateToken, [
  param('leaseId').isString().notEmpty(),
  body('landlordName').isString().notEmpty(),
  body('landlordEmail').isEmail(),
  body('tenantName').isString().notEmpty(),
  body('tenantEmail').isEmail(),
  body('propertyAddress').isString().notEmpty(),
  body('leaseStartDate').isISO8601().toDate(),
  body('leaseEndDate').isISO8601().toDate(),
  body('monthlyRent').isFloat({ min: 0 }),
  body('securityDeposit').isFloat({ min: 0 }),
  body('leaseTerms').isString(),
  validateRequest
], async (req, res) => {
  try {
    const { leaseId } = req.params;
    const leaseData = req.body;

    // Verify lease exists and user has permission
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({
        success: false,
        error: 'Lease not found'
      });
    }

    // Create DocuSign envelope
    const envelopeId = await docuSignService.createLeaseTemplate({
      ...leaseData,
      leaseStartDate: leaseData.leaseStartDate.toISOString().split('T')[0],
      leaseEndDate: leaseData.leaseEndDate.toISOString().split('T')[0]
    });

    // Store envelope reference
    await prisma.document.create({
      data: {
        name: 'Lease Agreement',
        type: 'LEASE',
        url: `docusign://${envelopeId}`,
        leaseId: leaseId,
        uploadedById: req.user!.id,
        description: 'DocuSign lease agreement'
      }
    });

    res.json({
      success: true,
      envelopeId,
      message: 'Lease agreement created and sent for signature'
    });
  } catch (error: any) {
    console.error('Error creating lease envelope:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create lease agreement'
    });
  }
});

// Get envelope status
router.get('/envelope/:envelopeId', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    const envelope = await docuSignService.getEnvelope(envelopeId);
    
    res.json({
      success: true,
      envelope: {
        id: envelope.envelopeId,
        status: envelope.status,
        emailSubject: envelope.emailSubject,
        createdDateTime: envelope.createdDateTime,
        sentDateTime: envelope.sentDateTime,
        completedDateTime: envelope.completedDateTime
      }
    });
  } catch (error: any) {
    console.error('Error getting envelope:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get envelope'
    });
  }
});

// Get envelope documents
router.get('/envelope/:envelopeId/documents', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    const documents = await docuSignService.getEnvelopeDocuments(envelopeId);
    
    res.json({
      success: true,
      documents: documents.envelopeDocuments || []
    });
  } catch (error: any) {
    console.error('Error getting envelope documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get documents'
    });
  }
});

// Get envelope recipients
router.get('/envelope/:envelopeId/recipients', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    const recipients = await docuSignService.getEnvelopeRecipients(envelopeId);
    
    res.json({
      success: true,
      recipients: {
        signers: recipients.signers || [],
        currentRoutingOrder: recipients.currentRoutingOrder
      }
    });
  } catch (error: any) {
    console.error('Error getting envelope recipients:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recipients'
    });
  }
});

// Create embedded signing URL
router.post('/envelope/:envelopeId/embedded-signing', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  body('signerEmail').isEmail(),
  body('signerName').isString().notEmpty(),
  body('clientUserId').isString().notEmpty(),
  body('returnUrl').isURL(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { signerEmail, signerName, clientUserId, returnUrl } = req.body;
    
    const signingUrl = await docuSignService.createEmbeddedSigningUrl(
      envelopeId,
      signerEmail,
      signerName,
      clientUserId,
      returnUrl
    );

    res.json({
      success: true,
      signingUrl,
      message: 'Embedded signing URL created'
    });
  } catch (error: any) {
    console.error('Error creating embedded signing URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create signing URL'
    });
  }
});

// Send envelope
router.post('/envelope/:envelopeId/send', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    await docuSignService.sendEnvelope(envelopeId);
    
    res.json({
      success: true,
      message: 'Envelope sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending envelope:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send envelope'
    });
  }
});

// Void envelope
router.post('/envelope/:envelopeId/void', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  body('reason').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { reason } = req.body;
    
    await docuSignService.voidEnvelope(envelopeId, reason);
    
    res.json({
      success: true,
      message: 'Envelope voided successfully'
    });
  } catch (error: any) {
    console.error('Error voiding envelope:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to void envelope'
    });
  }
});

// Download signed document
router.get('/envelope/:envelopeId/document/:documentId/download', authenticateToken, [
  param('envelopeId').isString().notEmpty(),
  param('documentId').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { envelopeId, documentId } = req.params;
    
    const documentBuffer = await docuSignService.downloadDocument(envelopeId, documentId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="signed-document-${documentId}.pdf"`);
    res.send(documentBuffer);
  } catch (error: any) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download document'
    });
  }
});

// Create custom envelope
router.post('/envelope', authenticateToken, [
  body('document.name').isString().notEmpty(),
  body('document.fileExtension').isString().notEmpty(),
  body('document.documentBase64').isString().notEmpty(),
  body('document.documentId').isString().notEmpty(),
  body('signers').isArray().notEmpty(),
  body('signers.*.email').isEmail(),
  body('signers.*.name').isString().notEmpty(),
  body('signers.*.clientUserId').isString().notEmpty(),
  body('emailSubject').isString().notEmpty(),
  body('emailBody').optional().isString(),
  body('status').isIn(['sent', 'created']),
  validateRequest
], async (req, res) => {
  try {
    const envelopeData = req.body;
    
    const envelopeId = await docuSignService.createEnvelope(envelopeData);
    
    res.json({
      success: true,
      envelopeId,
      message: 'Envelope created successfully'
    });
  } catch (error: any) {
    console.error('Error creating envelope:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create envelope'
    });
  }
});

export default router;