import { Router } from 'express';
import { approvalWorkflowService } from '../services/approvalWorkflow.service';
import { authMiddleware } from '../middleware/authMiddleware';
import { Request, Response } from 'express';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware.protect);

// Get all approval workflows
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const workflows = await approvalWorkflowService.getWorkflowByRequestType(req.query.requestType as any);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Create new approval workflow
router.post('/workflows', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { name, description, requestType, steps, autoApprovalRules } = req.body;

    const workflow = await approvalWorkflowService.createWorkflow(
      name,
      description,
      requestType,
      steps,
      autoApprovalRules
    );

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/workflows/:id', authMiddleware.checkRole(['ADMIN', 'PROPERTY_MANAGER']), async (req: Request, res: Response) => {
  try {
    // Implementation for workflow updates
    res.status(501).json({ error: 'Workflow update not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Initiate approval process
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { requestId, requestType, metadata } = req.body;
    const initiatedBy = (req as any).user.id;

    const instance = await approvalWorkflowService.initiateApproval({
      requestId,
      requestType,
      metadata,
      initiatedBy
    });

    res.status(201).json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate approval' });
  }
});

// Get pending approvals for current user
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const approvals = await approvalWorkflowService.getPendingApprovals(userId);
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// Process approval decision
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { action, comments, metadata } = req.body;
    const instanceId = req.params.id;
    const approverId = (req as any).user.id;

    const instance = await approvalWorkflowService.processDecision({
      instanceId,
      action,
      approverId,
      comments,
      metadata
    });

    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process approval decision' });
  }
});

// Delegate approval
router.post('/delegate', async (req: Request, res: Response) => {
  try {
    const { instanceId, toUserId, reason } = req.body;
    const fromUserId = (req as any).user.id;

    await approvalWorkflowService.delegateApproval(instanceId, fromUserId, toUserId, reason);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delegate approval' });
  }
});

// Get approval history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const instanceId = req.params.id;
    const history = await approvalWorkflowService.getApprovalHistory(instanceId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
});

export default router;