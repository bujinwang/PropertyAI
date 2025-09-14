import { prisma } from '../../config/database';
import { workflowAutomationService } from '../workflowAutomation.service';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    workflowDefinition: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    workflowInstance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workflowExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
    workflowEvent: {
      create: jest.fn(),
    },
    workflowIntegration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// Mock audit service
jest.mock('../audit.service', () => ({
  logEvent: jest.fn(),
}));

// Mock pubSub service
jest.mock('../pubSub.service', () => ({
  publish: jest.fn(),
}));

describe('WorkflowAutomationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflowDefinition', () => {
    it('should create a new workflow definition', async () => {
      const mockDefinition = {
        id: 'def_123',
        name: 'Test Workflow',
        description: 'Test description',
        category: 'Approvals',
        version: '1.0',
        isActive: true,
        isTemplate: false,
        definition: { steps: [] },
        metadata: {},
        createdBy: 'user_123',
        steps: [
          {
            stepId: 'step_1',
            name: 'step_1',
            type: 'task',
            config: { taskType: 'HTTP_REQUEST' },
          },
        ],
      };

      (prisma.workflowDefinition.create as jest.Mock).mockResolvedValue(mockDefinition);

      const result = await workflowAutomationService.createWorkflowDefinition(
        'Test Workflow',
        'Test description',
        'Approvals',
        { steps: [] },
        [
          {
            id: 'step_1',
            type: 'task',
            config: { taskType: 'HTTP_REQUEST' },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        'user_123'
      );

      expect(prisma.workflowDefinition.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Workflow',
          description: 'Test description',
          category: 'Approvals',
          definition: { steps: [] },
          isTemplate: false,
          metadata: undefined,
          createdBy: 'user_123',
          steps: {
            create: [
              {
                stepId: 'step_1',
                name: 'step_1',
                type: 'task',
                config: { taskType: 'HTTP_REQUEST' },
                position: { x: 100, y: 100 },
                connections: [],
              },
            ],
          },
        },
        include: {
          steps: true,
        },
      });
      expect(result).toEqual(mockDefinition);
    });
  });

  describe('startWorkflowInstance', () => {
    it('should start a new workflow instance', async () => {
      const mockDefinition = {
        id: 'def_123',
        name: 'Test Workflow',
        steps: [],
      };

      const mockInstance = {
        id: 'inst_123',
        definitionId: 'def_123',
        status: 'RUNNING',
        variables: { test: 'value' },
        context: {},
        initiatedBy: 'user_123',
        definition: mockDefinition,
      };

      (prisma.workflowDefinition.findUnique as jest.Mock).mockResolvedValue(mockDefinition);
      (prisma.workflowInstance.create as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.workflowEvent.create as jest.Mock).mockResolvedValue({});

      const result = await workflowAutomationService.startWorkflowInstance({
        definitionId: 'def_123',
        variables: { test: 'value' },
        initiatedBy: 'user_123',
      });

      expect(result).toEqual(mockInstance);
      expect(prisma.workflowInstance.create).toHaveBeenCalled();
      expect(prisma.workflowEvent.create).toHaveBeenCalledWith({
        data: {
          instanceId: 'inst_123',
          eventType: 'WORKFLOW_STARTED',
          eventData: {
            definitionId: 'def_123',
            initiatedBy: 'user_123',
            variables: { test: 'value' },
          },
        },
      });
    });

    it('should throw error if definition not found', async () => {
      (prisma.workflowDefinition.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        workflowAutomationService.startWorkflowInstance({
          definitionId: 'invalid_id',
          initiatedBy: 'user_123',
        })
      ).rejects.toThrow('Workflow definition not found');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow steps successfully', async () => {
      const mockInstance = {
        id: 'inst_123',
        definitionId: 'def_123',
        status: 'RUNNING',
        variables: {},
        definition: {
          steps: [
            {
              stepId: 'step_1',
              type: 'task',
              config: { taskType: 'HTTP_REQUEST' },
            },
          ],
        },
      };

      // Mock the executeStep method
      const executeStepSpy = jest.spyOn(workflowAutomationService as any, 'executeStep');
      executeStepSpy.mockResolvedValue({});

      const completeWorkflowSpy = jest.spyOn(workflowAutomationService as any, 'completeWorkflow');
      completeWorkflowSpy.mockResolvedValue({});

      await (workflowAutomationService as any).executeWorkflow(mockInstance);

      expect(executeStepSpy).toHaveBeenCalled();
      expect(completeWorkflowSpy).toHaveBeenCalledWith('inst_123', {});
    });

    it('should handle workflow execution errors', async () => {
      const mockInstance = {
        id: 'inst_123',
        definition: { steps: [] },
      };

      const executeStepSpy = jest.spyOn(workflowAutomationService as any, 'executeStep');
      executeStepSpy.mockRejectedValue(new Error('Step failed'));

      const failWorkflowSpy = jest.spyOn(workflowAutomationService as any, 'failWorkflow');
      failWorkflowSpy.mockResolvedValue({});

      await (workflowAutomationService as any).executeWorkflow(mockInstance);

      expect(failWorkflowSpy).toHaveBeenCalledWith('inst_123', expect.any(Error));
    });
  });

  describe('executeStep', () => {
    it('should execute task step', async () => {
      const step = {
        stepId: 'step_1',
        type: 'task',
        config: { taskType: 'HTTP_REQUEST', url: 'https://api.example.com' },
      };
      const context = {
        instanceId: 'inst_123',
        variables: {},
        currentStep: 'step_1',
      };

      const mockExecution = { id: 'exec_123' };

      (prisma.workflowExecution.create as jest.Mock).mockResolvedValue(mockExecution);
      (prisma.workflowExecution.update as jest.Mock).mockResolvedValue({});

      // Mock HTTP request
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await (workflowAutomationService as any).executeStep(step, context);

      expect(prisma.workflowExecution.create).toHaveBeenCalled();
      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: 'exec_123' },
        data: {
          status: 'COMPLETED',
          output: { success: true },
          completedAt: expect.any(Date),
        },
      });
    });

    it('should execute decision step', async () => {
      const step = {
        stepId: 'step_2',
        type: 'decision',
        config: {
          conditions: [
            {
              expression: 'variables.amount > 1000',
              path: 'high_value',
              description: 'High value approval needed',
            },
          ],
          defaultPath: 'standard',
        },
      };
      const context = {
        instanceId: 'inst_123',
        variables: { amount: 1500 },
        currentStep: 'step_2',
      };

      (prisma.workflowExecution.create as jest.Mock).mockResolvedValue({ id: 'exec_123' });
      (prisma.workflowExecution.update as jest.Mock).mockResolvedValue({});

      const result = await (workflowAutomationService as any).executeStep(step, context);

      expect(result).toEqual({
        decision: 'high_value',
        reason: 'High value approval needed',
      });
    });

    it('should handle step execution errors', async () => {
      const step = {
        stepId: 'step_1',
        type: 'task',
        config: { taskType: 'INVALID_TYPE' },
      };
      const context = {
        instanceId: 'inst_123',
        variables: {},
        currentStep: 'step_1',
      };

      (prisma.workflowExecution.create as jest.Mock).mockResolvedValue({ id: 'exec_123' });
      (prisma.workflowExecution.update as jest.Mock).mockResolvedValue({});

      await expect(
        (workflowAutomationService as any).executeStep(step, context)
      ).rejects.toThrow('Unknown task type: INVALID_TYPE');

      expect(prisma.workflowExecution.update).toHaveBeenCalledWith({
        where: { id: 'exec_123' },
        data: {
          status: 'FAILED',
          error: 'Unknown task type: INVALID_TYPE',
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('pauseWorkflow', () => {
    it('should pause running workflow', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'RUNNING',
        definition: { steps: [] },
      };

      (prisma.workflowInstance.update as jest.Mock).mockResolvedValue({
        ...mockInstance,
        status: 'PAUSED',
      });

      const result = await workflowAutomationService.pauseWorkflow('inst_123');

      expect(result.status).toBe('PAUSED');
      expect(prisma.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: 'inst_123' },
        data: { status: 'PAUSED' },
      });
    });
  });

  describe('resumeWorkflow', () => {
    it('should resume paused workflow', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'PAUSED',
        definition: { steps: [] },
      };

      (prisma.workflowInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);
      (prisma.workflowInstance.update as jest.Mock).mockResolvedValue({
        ...mockInstance,
        status: 'RUNNING',
      });

      const result = await workflowAutomationService.resumeWorkflow('inst_123');

      expect(result.status).toBe('RUNNING');
    });

    it('should throw error for non-paused workflow', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'RUNNING',
      };

      (prisma.workflowInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      await expect(
        workflowAutomationService.resumeWorkflow('inst_123')
      ).rejects.toThrow('Workflow is not paused');
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return workflow instance with details', async () => {
      const mockInstance = {
        id: 'inst_123',
        status: 'RUNNING',
        definition: { name: 'Test Workflow' },
        executions: [],
        events: [],
      };

      (prisma.workflowInstance.findUnique as jest.Mock).mockResolvedValue(mockInstance);

      const result = await workflowAutomationService.getWorkflowStatus('inst_123');

      expect(result).toEqual(mockInstance);
      expect(prisma.workflowInstance.findUnique).toHaveBeenCalledWith({
        where: { id: 'inst_123' },
        include: {
          definition: true,
          executions: {
            orderBy: { startedAt: 'desc' },
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });
    });
  });

  describe('getWorkflowAnalytics', () => {
    it('should return workflow analytics', async () => {
      const mockInstances = [
        { status: 'COMPLETED', initiatedAt: new Date(), completedAt: new Date() },
        { status: 'FAILED', initiatedAt: new Date() },
        { status: 'RUNNING', initiatedAt: new Date() },
      ];

      (prisma.workflowInstance.findMany as jest.Mock).mockResolvedValue(mockInstances);

      const result = await workflowAutomationService.getWorkflowAnalytics();

      expect(result.totalInstances).toBe(3);
      expect(result.completedInstances).toBe(1);
      expect(result.failedInstances).toBe(1);
      expect(result.runningInstances).toBe(1);
      expect(result.completionRate).toBeCloseTo(33.33, 1);
    });
  });

  describe('createIntegration', () => {
    it('should create a new workflow integration', async () => {
      const mockIntegration = {
        id: 'int_123',
        name: 'Test Integration',
        type: 'WEBHOOK',
        config: { url: 'https://example.com/webhook' },
        isActive: true,
      };

      (prisma.workflowIntegration.create as jest.Mock).mockResolvedValue(mockIntegration);

      const result = await workflowAutomationService.createIntegration(
        'Test Integration',
        'WEBHOOK' as any,
        { url: 'https://example.com/webhook' }
      );

      expect(result).toEqual(mockIntegration);
    });
  });

  describe('getWorkflowDefinitions', () => {
    it('should return workflow definitions', async () => {
      const mockDefinitions = [
        {
          id: 'def_123',
          name: 'Test Workflow',
          category: 'Approvals',
          isActive: true,
          steps: [],
        },
      ];

      (prisma.workflowDefinition.findMany as jest.Mock).mockResolvedValue(mockDefinitions);

      const result = await (workflowAutomationService as any).getWorkflowDefinitions();

      expect(result).toEqual(mockDefinitions);
      expect(prisma.workflowDefinition.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { steps: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getWorkflowTemplates', () => {
    it('should return workflow templates', async () => {
      const mockTemplates = [
        {
          id: 'tmpl_123',
          name: 'Approval Template',
          isTemplate: true,
          steps: [],
        },
      ];

      (prisma.workflowDefinition.findMany as jest.Mock).mockResolvedValue(mockTemplates);

      const result = await (workflowAutomationService as any).getWorkflowTemplates();

      expect(result).toEqual(mockTemplates);
      expect(prisma.workflowDefinition.findMany).toHaveBeenCalledWith({
        where: {
          isTemplate: true,
          isActive: true,
        },
        include: { steps: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('createFromTemplate', () => {
    it('should create workflow from template', async () => {
      const mockTemplate = {
        id: 'tmpl_123',
        name: 'Approval Template',
        description: 'Template description',
        category: 'Approvals',
        definition: { steps: [] },
        metadata: {},
        isTemplate: true,
        steps: [
          {
            stepId: 'step_1',
            name: 'step_1',
            type: 'task',
            config: {},
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
      };

      const mockNewWorkflow = {
        id: 'def_456',
        name: 'Custom Approval Workflow',
        description: 'Custom description',
        category: 'Custom',
        isTemplate: false,
        createdBy: 'user_123',
        steps: [],
      };

      (prisma.workflowDefinition.findUnique as jest.Mock).mockResolvedValue(mockTemplate);
      (prisma.workflowDefinition.create as jest.Mock).mockResolvedValue(mockNewWorkflow);

      const result = await (workflowAutomationService as any).createFromTemplate(
        'tmpl_123',
        {
          name: 'Custom Approval Workflow',
          description: 'Custom description',
          category: 'Custom',
        },
        'user_123'
      );

      expect(result).toEqual(mockNewWorkflow);
    });

    it('should throw error for non-template', async () => {
      const mockDefinition = {
        id: 'def_123',
        isTemplate: false,
      };

      (prisma.workflowDefinition.findUnique as jest.Mock).mockResolvedValue(mockDefinition);

      await expect(
        (workflowAutomationService as any).createFromTemplate('def_123', {}, 'user_123')
      ).rejects.toThrow('Template not found');
    });
  });
});