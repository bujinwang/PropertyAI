import { prisma } from '../../config/database';
import { approvalWorkflowService } from '../approvalWorkflow.service';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    approvalWorkflow: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    approvalInstance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    approvalAction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// Mock notification service
jest.mock('../notificationService', () => ({
  sendNotification: jest.fn(),
}));

// Mock audit service
jest.mock('../audit.service', () => ({
  logEvent: jest.fn(),
}));

// Mock pubSub service
jest.mock('../pubSub.service', () => ({
  publish: jest.fn(),
}));

describe('ApprovalWorkflowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    it('should create a new approval workflow', async () => {
      const mockWorkflow = {
        id: 'wf_123',
        name: 'Test Workflow',
        description: 'Test description',
        requestType: 'MAINTENANCE_REQUEST',
        isActive: true,
        steps: [
          {
            stepNumber: 1,
            stepType: 'APPROVAL',
            approverRole: 'PROPERTY_MANAGER',
            timeoutHours: 24,
          },
        ],
      };

      (prisma.approvalWorkflow.create as jest.Mock).mockResolvedValue(mockWorkflow);

      const result = await approvalWorkflowService.createWorkflow(
        'Test Workflow',
        'Test description',
        'MAINTENANCE_REQUEST' as any,
        [
          {
            stepNumber: 1,
            stepType: 'APPROVAL' as any,
            approverRole: 'PROPERTY_MANAGER',
            timeoutHours: 24,
          },
        ]
      );

      expect(prisma.approvalWorkflow.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Workflow',
          description: 'Test description',
          requestType: 'MAINTENANCE_REQUEST',
          autoApprovalRules: undefined,
          steps: {
            create: [
              {
                stepNumber: 1,
                stepType: 'APPROVAL',
                approverRole: 'PROPERTY_MANAGER',
                timeoutHours: 24,
              },
            ],
          },
        },
        include: {
          steps: true,
        },
      });
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('getWorkflowByRequestType', () => {
    it('should return active workflow for request type', async () => {
      const mockWorkflow = {
        id: 'wf_123',
        name: 'Maintenance Workflow',
        requestType: 'MAINTENANCE_REQUEST',
        isActive: true,
        steps: [],
      };

      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);

      const result = await approvalWorkflowService.getWorkflowByRequestType('MAINTENANCE_REQUEST' as any);

      expect(prisma.approvalWorkflow.findFirst).toHaveBeenCalledWith({
        where: {
          requestType: 'MAINTENANCE_REQUEST',
          isActive: true,
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockWorkflow);
    });

    it('should return null if no workflow found', async () => {
      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await approvalWorkflowService.getWorkflowByRequestType('UNKNOWN_TYPE' as any);

      expect(result).toBeNull();
    });
  });

  describe('initiateApproval', () => {
    it('should initiate approval process for valid request', async () => {
      const mockWorkflow = {
        id: 'wf_123',
        name: 'Test Workflow',
        requestType: 'MAINTENANCE_REQUEST',
        isActive: true,
        autoApprovalRules: null,
        steps: [
          {
            stepNumber: 1,
            stepType: 'APPROVAL',
            approverRole: 'PROPERTY_MANAGER',
          },
        ],
      };

      const mockInstance = {
        id: 'inst_123',
        workflowId: 'wf_123',
        requestId: 'req_123',
        requestType: 'MAINTENANCE_REQUEST',
        status: 'PENDING',
        currentStep: 1,
        initiatedBy: 'user_123',
        metadata: { amount: 500 },
      };

      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.approvalInstance.create as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await approvalWorkflowService.initiateApproval({
        requestId: 'req_123',
        requestType: 'MAINTENANCE_REQUEST' as any,
        metadata: { amount: 500 },
        initiatedBy: 'user_123',
      });

      expect(result).toEqual(mockInstance);
      expect(prisma.approvalInstance.create).toHaveBeenCalled();
    });

    it('should throw error if no workflow found', async () => {
      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        approvalWorkflowService.initiateApproval({
          requestId: 'req_123',
          requestType: 'UNKNOWN_TYPE' as any,
          metadata: {},
          initiatedBy: 'user_123',
        })
      ).rejects.toThrow('No active workflow found for request type: UNKNOWN_TYPE');
    });

    it('should auto-approve based on rules', async () => {
      const mockWorkflow = {
        id: 'wf_123',
        name: 'Test Workflow',
        requestType: 'MAINTENANCE_REQUEST',
        isActive: true,
        autoApprovalRules: { amount: 1000 }, // Auto-approve amounts <= 1000
        steps: [],
      };

      const mockInstance = {
        id: 'inst_123',
        workflowId: 'wf_123',
        requestId: 'req_123',
        requestType: 'MAINTENANCE_REQUEST',
        status: 'APPROVED',
        initiatedBy: 'user_123',
        metadata: { amount: 500 },
        completedAt: expect.any(Date),
      };

      (prisma.approvalWorkflow.findFirst as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.approvalInstance.create as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});

      const result = await approvalWorkflowService.initiateApproval({
        requestId: 'req_123',
        requestType: 'MAINTENANCE_REQUEST' as any,
        metadata: { amount: 500 },
        initiatedBy: 'user_123',
      });

      expect(result.status).toBe('APPROVED');
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('processDecision', () => {
    it('should approve and move to next step', async () => {
      const mockInstance = {
        id: 'inst_123',
        workflowId: 'wf_123',
        status: 'PENDING',
        currentStep: 1,
        workflow: {
          steps: [
            { stepNumber: 1, stepType: 'APPROVAL' },
            { stepNumber: 2, stepType: 'APPROVAL' },
          ],
        },
        approvals: [],
      };

      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});
      (prisma.approvalInstance.update as jest.Mock).mockResolvedValue({
        ...mockInstance,
        currentStep: 2,
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await approvalWorkflowService.processDecision({
        instanceId: 'inst_123',
        action: 'APPROVE' as any,
        approverId: 'user_123',
        comments: 'Approved',
      });

      expect(result.currentStep).toBe(2);
      expect(prisma.approvalAction.create).toHaveBeenCalledWith({
        data: {
          instanceId: 'inst_123',
          stepNumber: 1,
          approverId: 'user_123',
          action: 'APPROVE',
          comments: 'Approved',
          metadata: undefined,
        },
      });
    });

    it('should complete workflow on final approval', async () => {
      const mockInstance = {
        id: 'inst_123',
        workflowId: 'wf_123',
        status: 'PENDING',
        currentStep: 2,
        workflow: {
          steps: [
            { stepNumber: 1, stepType: 'APPROVAL' },
            { stepNumber: 2, stepType: 'APPROVAL' },
          ],
        },
        approvals: [],
      };

      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});
      (prisma.approvalInstance.update as jest.Mock).mockResolvedValue({
        ...mockInstance,
        status: 'APPROVED',
        completedAt: new Date(),
      });

      const result = await approvalWorkflowService.processDecision({
        instanceId: 'inst_123',
        action: 'APPROVE' as any,
        approverId: 'user_123',
      });

      expect(result.status).toBe('APPROVED');
      expect(result.completedAt).toBeDefined();
    });

    it('should reject workflow', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'PENDING',
        currentStep: 1,
        workflow: { steps: [] },
        approvals: [],
      };

      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});
      (prisma.approvalInstance.update as jest.Mock).mockResolvedValue({
        ...mockInstance,
        status: 'REJECTED',
        completedAt: new Date(),
      });

      const result = await approvalWorkflowService.processDecision({
        instanceId: 'inst_123',
        action: 'REJECT' as any,
        approverId: 'user_123',
        comments: 'Not approved',
      });

      expect(result.status).toBe('REJECTED');
    });

    it('should throw error for invalid instance', async () => {
      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        approvalWorkflowService.processDecision({
          instanceId: 'invalid_id',
          action: 'APPROVE' as any,
          approverId: 'user_123',
        })
      ).rejects.toThrow('Approval instance not found');
    });

    it('should throw error for completed instance', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'APPROVED',
        workflow: { steps: [] },
        approvals: [],
      };

      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await expect(
        approvalWorkflowService.processDecision({
          instanceId: 'inst_123',
          action: 'APPROVE' as any,
          approverId: 'user_123',
        })
      ).rejects.toThrow('Approval instance is not in pending status');
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for user', async () => {
      const mockApprovals = [
        {
          id: 'inst_123',
          status: 'PENDING',
          workflow: { steps: [] },
          approvals: [],
        },
      ];

      (prisma.approvalInstance.findMany as jest.Mock).mockResolvedValue(mockApprovals);

      const result = await approvalWorkflowService.getPendingApprovals('user_123');

      expect(prisma.approvalInstance.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockApprovals);
    });
  });

  describe('delegateApproval', () => {
    it('should delegate approval to another user', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'PENDING',
        currentStep: 1,
        workflow: {
          steps: [{ id: 'step_1', stepNumber: 1, approverRole: 'MANAGER' }],
        },
      };

      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.approvalStep.update as jest.Mock).mockResolvedValue({});
      (prisma.approvalAction.create as jest.Mock).mockResolvedValue({});
      (prisma.approvalInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await approvalWorkflowService.delegateApproval(
        'inst_123',
        'user_123',
        'user_456',
        'On vacation'
      );

      expect(prisma.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step_1' },
        data: {
          approverUserId: 'user_456',
          approverRole: null,
        },
      });

      expect(prisma.approvalAction.create).toHaveBeenCalledWith({
        data: {
          instanceId: 'inst_123',
          stepNumber: 1,
          approverId: 'user_123',
          action: 'DELEGATE',
          comments: 'Delegated to user user_456. Reason: On vacation',
        },
      });
    });
  });

  describe('getApprovalHistory', () => {
    it('should return approval history with instance details', async () => {
      const mockHistory = [
        {
          id: 'action_123',
          instanceId: 'inst_123',
          stepNumber: 1,
          approverId: 'user_123',
          action: 'APPROVE',
          approvedAt: new Date(),
          instance: {
            workflow: { name: 'Test Workflow' },
          },
        },
      ];

      (prisma.approvalAction.findMany as jest.Mock).mockResolvedValue(mockHistory);

      const result = await approvalWorkflowService.getApprovalHistory('inst_123');

      expect(result).toEqual(mockHistory);
      expect(prisma.approvalAction.findMany).toHaveBeenCalledWith({
        where: { instanceId: 'inst_123' },
        include: {
          instance: {
            include: {
              workflow: true,
            },
          },
        },
        orderBy: { approvedAt: 'asc' },
      });
    });
  });
});