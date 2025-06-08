import express from 'express';
import { Application } from '../models/mongoModels';

const router = express.Router();

/**
 * @route   GET /api/applications
 * @desc    Get all applications with optional filtering
 * @access  Private (landlord/admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { status, propertyId, unitId, applicantId } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (propertyId) {
      filter.propertyId = propertyId;
    }
    
    if (unitId) {
      filter.unitId = unitId;
    }
    
    if (applicantId) {
      filter.applicantId = applicantId;
    }
    
    const applications = await Application.find(filter)
      .sort({ submittedAt: -1 });
    
    res.json({
      status: 'success',
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching applications'
    });
  }
});

/**
 * @route   GET /api/applications/:id
 * @desc    Get a single application by ID
 * @access  Private (landlord/admin and application owner)
 */
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // TODO: Add authorization check - only landlords or the applicant should access
    
    res.json({
      status: 'success',
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching application'
    });
  }
});

/**
 * @route   POST /api/applications
 * @desc    Create a new application
 * @access  Private (authenticated users)
 */
router.post('/', async (req, res) => {
  try {
    const {
      applicantId,
      propertyId,
      unitId,
      listingId,
      personalInfo,
      employmentInfo,
      rentalHistory,
      references
    } = req.body;
    
    // Validate required fields
    if (!applicantId || !propertyId || !unitId || !personalInfo || !employmentInfo) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }
    
    // Create new application
    const newApplication = new Application({
      applicantId,
      propertyId,
      unitId,
      listingId,
      status: 'draft',
      submittedAt: new Date(),
      updatedAt: new Date(),
      personalInfo,
      employmentInfo,
      rentalHistory: rentalHistory || [],
      references: references || [],
      documents: []
    });
    
    const savedApplication = await newApplication.save();
    
    res.status(201).json({
      status: 'success',
      data: savedApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating application'
    });
  }
});

/**
 * @route   PUT /api/applications/:id
 * @desc    Update an application
 * @access  Private (application owner or admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // TODO: Add authorization check - only application owner should update unless admin
    
    // Update timestamp
    req.body.updatedAt = new Date();
    
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating application'
    });
  }
});

/**
 * @route   POST /api/applications/:id/submit
 * @desc    Submit a draft application
 * @access  Private (application owner)
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    if (application.status !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: `Application cannot be submitted (current status: ${application.status})`
      });
    }
    
    // TODO: Validate all required fields are present
    
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.updatedAt = new Date();
    
    await application.save();
    
    res.json({
      status: 'success',
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error submitting application'
    });
  }
});

/**
 * @route   POST /api/applications/:id/review
 * @desc    Review an application (approve/deny)
 * @access  Private (landlord/admin only)
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { status, reviewedBy, notes } = req.body;
    
    if (!status || !['approved', 'denied'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide valid status (approved or denied)'
      });
    }
    
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    if (application.status !== 'submitted' && application.status !== 'in-review') {
      return res.status(400).json({
        status: 'error',
        message: `Application cannot be reviewed (current status: ${application.status})`
      });
    }
    
    // Update application status
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = reviewedBy;
    application.updatedAt = new Date();
    
    // Add note if provided
    if (notes) {
      application.notes = [...(application.notes || []), notes];
    }
    
    await application.save();
    
    res.json({
      status: 'success',
      message: `Application ${status} successfully`,
      data: application
    });
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error reviewing application'
    });
  }
});

/**
 * @route   POST /api/applications/:id/document
 * @desc    Add a document to an application
 * @access  Private (application owner or admin)
 */
router.post('/:id/document', async (req, res) => {
  try {
    const { documentUrl } = req.body;
    
    if (!documentUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a document URL'
      });
    }
    
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // Add document to the application
    application.documents.push(documentUrl);
    application.updatedAt = new Date();
    
    await application.save();
    
    res.json({
      status: 'success',
      message: 'Document added successfully',
      data: application
    });
  } catch (error) {
    console.error('Error adding document to application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error adding document'
    });
  }
});

/**
 * @route   DELETE /api/applications/:id
 * @desc    Delete an application
 * @access  Private (application owner or admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        status: 'error',
        message: 'Application not found'
      });
    }
    
    // TODO: Add authorization check
    
    await application.deleteOne();
    
    res.json({
      status: 'success',
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting application'
    });
  }
});

export default router; 