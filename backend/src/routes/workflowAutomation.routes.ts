import { Router } from 'express';
import { workflowAutomationService } from '../services/workflowAutomation.service';
import { authMiddleware } from '../middleware/authMiddleware';
import { Request, Response } from 'express';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware.protect);

// Workflow Definitions

// Get all workflow definitions
router.get('/definitions', async (req: Request, res: Response) => {
  try {
    const { category, isTemplate } = req.query;

    const definitions = await workflowAutomationService.getWorkflowDefinitions(
      category as string,
      isTemplate === 'true'
    );

    res.json(definitions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow definitions' });
  }
});

// Create new workflow definition
router.post('/definitions', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { name, description, category, definition, steps, isTemplate, metadata } = req.body;
    const createdBy = (req as any).user.id;

    const workflowDef = await workflowAutomationService.createWorkflowDefinition(
      name,
      description,
      category,
      definition,
      steps,
      createdBy,
      isTemplate,
      metadata
    );

    res.status(201).json(workflowDef);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow definition' });
  }
});

// Update workflow definition
router.put('/definitions/:id', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await workflowAutomationService.updateWorkflowDefinition(id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow definition' });
  }
});

// Workflow Instances

// Start new workflow instance
router.post('/instances', async (req: Request, res: Response) => {
  try {
    const { definitionId, variables, context } = req.body;
    const initiatedBy = (req as any).user.id;

    const instance = await workflowAutomationService.startWorkflowInstance({
      definitionId,
      variables,
      initiatedBy,
      context
    });

    res.status(201).json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start workflow instance' });
  }
});

// Get workflow instance status
router.get('/instances/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instance = await workflowAutomationService.getWorkflowStatus(id);

    if (!instance) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }

    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow status' });
  }
});

// Get real-time workflow status
router.get('/instances/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await workflowAutomationService.getWorkflowStatus(id);

    if (!status) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }

    res.json({
      id: status.id,
      status: status.status,
      currentStep: status.currentStep,
      variables: status.variables,
      initiatedAt: status.initiatedAt,
      completedAt: status.completedAt,
      duration: status.duration
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow status' });
  }
});

// Pause workflow
router.post('/instances/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instance = await workflowAutomationService.pauseWorkflow(id);
    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pause workflow' });
  }
});

// Resume workflow
router.post('/instances/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instance = await workflowAutomationService.resumeWorkflow(id);
    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resume workflow' });
  }
});

// Workflow Analytics

// Get workflow analytics
router.get('/analytics', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { definitionId, startDate, endDate } = req.query;

    const analytics = await workflowAutomationService.getWorkflowAnalytics(
      definitionId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow analytics' });
  }
});

// Workflow Integrations

// Get all integrations
router.get('/integrations', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    const integrations = await workflowAutomationService.getIntegrations();
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Create new integration
router.post('/integrations', authMiddleware.checkRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { name, type, config } = req.body;

    const integration = await workflowAutomationService.createIntegration(name, type, config);
    res.status(201).json(integration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// Update integration
router.put('/integrations/:id', authMiddleware.checkRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await workflowAutomationService.updateIntegration(id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Test integration
router.post('/integrations/:id/test', authMiddleware.checkRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testResult = await workflowAutomationService.testIntegration(id);
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: 'Integration test failed' });
  }
});

// Workflow Templates

// Get workflow templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await workflowAutomationService.getWorkflowTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow templates' });
  }
});

// Create workflow from template
router.post('/templates/:templateId/instantiate', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { customizations } = req.body;
    const createdBy = (req as any).user.id;

    const workflow = await workflowAutomationService.createFromTemplate(templateId, customizations, createdBy);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow from template' });
  }
});

export default router;