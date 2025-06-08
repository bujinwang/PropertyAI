import express from 'express';
import { AIGeneratedContent } from '../models/mongoModels';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * @route   GET /api/ai-content
 * @desc    Get all AI-generated content with optional filtering
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { contentType, relatedEntityId, relatedEntityType, status, tags } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (contentType) {
      filter.contentType = contentType;
    }
    
    if (relatedEntityId) {
      filter.relatedEntityId = relatedEntityId;
    }
    
    if (relatedEntityType) {
      filter.relatedEntityType = relatedEntityType;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (tags) {
      // If tags is a string, convert to array; otherwise, use as is
      const tagArray = typeof tags === 'string' ? [tags] : tags;
      filter.tags = { $in: tagArray };
    }
    
    const aiContents = await AIGeneratedContent.find(filter)
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: aiContents.length,
      data: aiContents
    });
  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching AI content'
    });
  }
});

/**
 * @route   GET /api/ai-content/:id
 * @desc    Get a single AI content by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });
    
    if (!aiContent) {
      return res.status(404).json({
        status: 'error',
        message: 'AI content not found'
      });
    }
    
    // Increment view count if usageMetrics exists
    if (aiContent.usageMetrics) {
      aiContent.usageMetrics.views += 1;
      await aiContent.save();
    }
    
    res.json({
      status: 'success',
      data: aiContent
    });
  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching AI content'
    });
  }
});

/**
 * @route   POST /api/ai-content/generate
 * @desc    Generate new AI content
 * @access  Private
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      contentType,
      prompt,
      relatedEntityId,
      relatedEntityType,
      modelName,
      modelVersion,
      parameters,
      tags,
      userId
    } = req.body;
    
    // Validate required fields
    if (!contentType || !prompt || !userId || !modelName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }
    
    // TODO: This is where we would actually call the AI service to generate content
    // For now, simulate AI-generated content
    const simulatedAIResponse = `Sample AI-generated content for prompt: "${prompt}"\n\nThis would be replaced with actual AI-generated content in production.`;
    
    // Create new AI content record
    const newAIContent = new AIGeneratedContent({
      contentId: uuidv4(),
      contentType,
      originalPrompt: prompt,
      generatedContent: simulatedAIResponse,
      relatedEntityId,
      relatedEntityType,
      modelName,
      modelVersion,
      parameters: parameters || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      status: 'draft',
      tags: tags || [],
      usageMetrics: {
        views: 0,
        conversions: 0,
        engagement: 0
      }
    });
    
    const savedAIContent = await newAIContent.save();
    
    res.status(201).json({
      status: 'success',
      data: savedAIContent
    });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error generating AI content'
    });
  }
});

/**
 * @route   PUT /api/ai-content/:id
 * @desc    Update AI content
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });
    
    if (!aiContent) {
      return res.status(404).json({
        status: 'error',
        message: 'AI content not found'
      });
    }
    
    // If the content is being changed, add to revision history
    if (req.body.generatedContent && req.body.generatedContent !== aiContent.generatedContent) {
      // Initialize revision history if it doesn't exist
      if (!aiContent.revisionHistory) {
        aiContent.revisionHistory = [];
      }
      
      // Add current content to revision history
      aiContent.revisionHistory.push({
        version: aiContent.revisionHistory.length + 1,
        content: aiContent.generatedContent,
        prompt: aiContent.originalPrompt,
        timestamp: new Date(),
        revisedBy: req.body.revisedBy || aiContent.createdBy
      });
    }
    
    // Update timestamp
    req.body.updatedAt = new Date();
    
    // Update the content
    const updatedAIContent = await AIGeneratedContent.findOneAndUpdate(
      { contentId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      data: updatedAIContent
    });
  } catch (error) {
    console.error('Error updating AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating AI content'
    });
  }
});

/**
 * @route   POST /api/ai-content/:id/publish
 * @desc    Publish AI content (change status from draft to published)
 * @access  Private
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });
    
    if (!aiContent) {
      return res.status(404).json({
        status: 'error',
        message: 'AI content not found'
      });
    }
    
    if (aiContent.status === 'published') {
      return res.status(400).json({
        status: 'error',
        message: 'Content is already published'
      });
    }
    
    aiContent.status = 'published';
    aiContent.updatedAt = new Date();
    
    await aiContent.save();
    
    res.json({
      status: 'success',
      message: 'AI content published successfully',
      data: aiContent
    });
  } catch (error) {
    console.error('Error publishing AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error publishing AI content'
    });
  }
});

/**
 * @route   POST /api/ai-content/:id/feedback
 * @desc    Add user feedback to AI content
 * @access  Private
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { userId, rating, comments } = req.body;
    
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide valid user ID and rating (1-5)'
      });
    }
    
    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });
    
    if (!aiContent) {
      return res.status(404).json({
        status: 'error',
        message: 'AI content not found'
      });
    }
    
    // Initialize feedback array if it doesn't exist
    if (!aiContent.feedback) {
      aiContent.feedback = [];
    }
    
    // Add feedback
    aiContent.feedback.push({
      userId,
      rating,
      comments,
      timestamp: new Date()
    });
    
    aiContent.updatedAt = new Date();
    
    await aiContent.save();
    
    res.json({
      status: 'success',
      message: 'Feedback added successfully',
      data: aiContent
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error adding feedback'
    });
  }
});

/**
 * @route   DELETE /api/ai-content/:id
 * @desc    Delete AI content
 * @access  Private (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const aiContent = await AIGeneratedContent.findOne({ contentId: req.params.id });
    
    if (!aiContent) {
      return res.status(404).json({
        status: 'error',
        message: 'AI content not found'
      });
    }
    
    // TODO: Add authorization check
    
    await aiContent.deleteOne();
    
    res.json({
      status: 'success',
      message: 'AI content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AI content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting AI content'
    });
  }
});

export default router; 