import { prisma } from '../config/database';
import {
  ApprovalWorkflow,
  ApprovalStep,
  ApprovalInstance,
  ApprovalAction,
  RequestType,
  ApprovalStatus,
  ApprovalActionType,
  StepType
} from '@prisma/client';
import { sendNotification } from './notificationService';
import { pubSubService } from './pubSub.service';
import { auditService } from './audit.service';

interface ApprovalRequest {
  requestId: string;
  requestType: RequestType;
  metadata: any;
  initiatedBy: string;
}

interface ApprovalDecision {
  instanceId: string;
  action: ApprovalActionType;
  approverId: string;
  comments?: string;
  metadata?: any;
}

class ApprovalWorkflowService {
  /**
   * Create a new approval workflow
   */
  public async createWorkflow(
    name: string,
    description: string,
    requestType: RequestType,
    steps: Omit<ApprovalStep, 'id' | 'workflowId'>[],
    autoApprovalRules?: any
  ): Promise<ApprovalWorkflow> {
    return await prisma.$transaction(async (tx) => {
      const workflow = await tx.approvalWorkflow.create({
        data: {
          name,
          description,
          requestType,
          autoApprovalRules,
          steps: {
            create: steps
          }
        },
        include: {
          steps: true
        }
      });

      await auditService.logEvent('WORKFLOW_CREATED', workflow.id, {
        name,
        requestType,
        stepCount: steps.length
      });

      return workflow;
    });
  }

  /**
   * Get workflow by request type
   */
  public async getWorkflowByRequestType(requestType: RequestType): Promise<ApprovalWorkflow | null> {
    return prisma.approvalWorkflow.findFirst({
      where: {
        requestType,
        isActive: true
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });
  }

  /**
   * Initiate approval process for a request
   */
  public async initiateApproval(request: ApprovalRequest): Promise<ApprovalInstance> {
    const workflow = await this.getWorkflowByRequestType(request.requestType);

    if (!workflow) {
      throw new Error(`No active workflow found for request type: ${request.requestType}`);
    }

    // Check auto-approval rules
    if (workflow.autoApprovalRules && this.evaluateAutoApproval(workflow.autoApprovalRules, request.metadata)) {
      return this.autoApproveRequest(request, workflow);
    }

    const instance = await prisma.$transaction(async (tx) => {
      const instance = await tx.approvalInstance.create({
        data: {
          workflowId: workflow.id,
          requestId: request.requestId,
          requestType: request.requestType,
          initiatedBy: request.initiatedBy,
          metadata: request.metadata,
          currentStep: 1
        },
        include: {
          workflow: {
            include: { steps: true }
          }
        }
      });

      // Create initial approval action for tracking
      await tx.approvalAction.create({
        data: {
          instanceId: instance.id,
          stepNumber: 0,
          approverId: request.initiatedBy,
          action: ApprovalActionType.COMMENT,
          comments: 'Approval process initiated'
        }
      });

      return instance;
    });

    // Notify first approver
    await this.notifyNextApprover(instance);

    await auditService.logEvent('APPROVAL_INITIATED', instance.id, {
      requestId: request.requestId,
      requestType: request.requestType,
      workflowId: workflow.id
    });

    // Publish real-time update
    pubSubService.publish('approval-updates', JSON.stringify({
      type: 'APPROVAL_INITIATED',
      payload: instance
    }));

    return instance;
  }

  /**
   * Process approval decision
   */
  public async processDecision(decision: ApprovalDecision): Promise<ApprovalInstance> {
    const instance = await prisma.approvalInstance.findUnique({
      where: { id: decision.instanceId },
      include: {
        workflow: {
          include: { steps: true }
        },
        approvals: true
      }
    });

    if (!instance) {
      throw new Error('Approval instance not found');
    }

    if (instance.status !== ApprovalStatus.PENDING) {
      throw new Error('Approval instance is not in pending status');
    }

    const currentStep = instance.workflow.steps.find(s => s.stepNumber === instance.currentStep);

    if (!currentStep) {
      throw new Error('Current step not found in workflow');
    }

    // Verify approver has permission
    if (!await this.canApproveStep(currentStep, decision.approverId)) {
      throw new Error('User does not have permission to approve this step');
    }

    return await prisma.$transaction(async (tx) => {
      // Record the decision
      await tx.approvalAction.create({
        data: {
          instanceId: decision.instanceId,
          stepNumber: instance.currentStep,
          approverId: decision.approverId,
          action: decision.action,
          comments: decision.comments,
          metadata: decision.metadata
        }
      });

      let newStatus = instance.status;
      let nextStep = instance.currentStep;

      if (decision.action === ApprovalActionType.APPROVE) {
        // Check if there are more steps
        const nextStepData = instance.workflow.steps.find(s => s.stepNumber === instance.currentStep + 1);

        if (nextStepData) {
          nextStep = instance.currentStep + 1;
          // Notify next approver
          const updatedInstance = await tx.approvalInstance.update({
            where: { id: decision.instanceId },
            data: { currentStep: nextStep },
            include: { workflow: { include: { steps: true } } }
          });
          await this.notifyNextApprover(updatedInstance);
        } else {
          // Workflow completed successfully
          newStatus = ApprovalStatus.APPROVED;
          nextStep = instance.currentStep;
          await tx.approvalInstance.update({
            where: { id: decision.instanceId },
            data: {
              status: newStatus,
              completedAt: new Date()
            }
          });
        }
      } else if (decision.action === ApprovalActionType.REJECT) {
        newStatus = ApprovalStatus.REJECTED;
        await tx.approvalInstance.update({
          where: { id: decision.instanceId },
          data: {
            status: newStatus,
            completedAt: new Date()
          }
        });
      } else if (decision.action === ApprovalActionType.ESCALATE) {
        // Handle escalation logic
        await this.handleEscalation(instance, decision);
      }

      const updatedInstance = await tx.approvalInstance.findUnique({
        where: { id: decision.instanceId },
        include: {
          workflow: { include: { steps: true } },
          approvals: true
        }
      });

      if (!updatedInstance) {
        throw new Error('Failed to retrieve updated instance');
      }

      await auditService.logEvent('APPROVAL_DECISION', decision.instanceId, {
        action: decision.action,
        step: instance.currentStep,
        approverId: decision.approverId
      });

      // Publish real-time update
      pubSubService.publish('approval-updates', JSON.stringify({
        type: 'APPROVAL_DECISION',
        payload: updatedInstance
      }));

      return updatedInstance;
    });
  }

  /**
   * Get pending approvals for user
   */
  public async getPendingApprovals(userId: string): Promise<ApprovalInstance[]> {
    return prisma.approvalInstance.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        workflow: {
          steps: {
            some: {
              stepNumber: {
                equals: prisma.approvalInstance.fields.currentStep
              },
              OR: [
                { approverUserId: userId },
                {
                  approverRole: {
                    in: await this.getUserRoles(userId)
                  }
                }
              ]
            }
          }
        }
      },
      include: {
        workflow: {
          include: { steps: true }
        },
        approvals: {
          include: {
            instance: false // Avoid circular reference
          }
        }
      }
    });
  }

  /**
   * Delegate approval authority
   */
  public async delegateApproval(
    instanceId: string,
    fromUserId: string,
    toUserId: string,
    reason?: string
  ): Promise<void> {
    const instance = await prisma.approvalInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: { include: { steps: true } } }
    });

    if (!instance) {
      throw new Error('Approval instance not found');
    }

    const currentStep = instance.workflow.steps.find(s => s.stepNumber === instance.currentStep);

    if (!currentStep || !await this.canApproveStep(currentStep, fromUserId)) {
      throw new Error('User does not have permission to delegate this approval');
    }

    await prisma.$transaction(async (tx) => {
      // Update the step to delegate to the new user
      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          approverUserId: toUserId,
          approverRole: null // Clear role when delegating to specific user
        }
      });

      // Record delegation action
      await tx.approvalAction.create({
        data: {
          instanceId,
          stepNumber: instance.currentStep,
          approverId: fromUserId,
          action: ApprovalActionType.DELEGATE,
          comments: `Delegated to user ${toUserId}. Reason: ${reason || 'Not specified'}`
        }
      });
    });

    // Notify the new approver
    const updatedInstance = await prisma.approvalInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: { include: { steps: true } } }
    });

    if (updatedInstance) {
      await this.notifyNextApprover(updatedInstance);
    }

    await auditService.logEvent('APPROVAL_DELEGATED', instanceId, {
      fromUserId,
      toUserId,
      reason
    });
  }

  /**
   * Get approval history and audit trail
   */
  public async getApprovalHistory(instanceId: string): Promise<ApprovalAction[]> {
    return prisma.approvalAction.findMany({
      where: { instanceId },
      include: {
        instance: {
          include: {
            workflow: true
          }
        }
      },
      orderBy: { approvedAt: 'asc' }
    });
  }

  // Private helper methods

  private async evaluateAutoApproval(rules: any, metadata: any): Promise<boolean> {
    // Simple rule evaluation - can be extended with a proper rules engine
    try {
      if (rules.amount && metadata.amount && metadata.amount <= rules.amount) {
        return true;
      }
      if (rules.priority && metadata.priority === 'LOW') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error evaluating auto-approval rules:', error);
      return false;
    }
  }

  private async autoApproveRequest(request: ApprovalRequest, workflow: ApprovalWorkflow): Promise<ApprovalInstance> {
    const instance = await prisma.approvalInstance.create({
      data: {
        workflowId: workflow.id,
        requestId: request.requestId,
        requestType: request.requestType,
        status: ApprovalStatus.APPROVED,
        initiatedBy: request.initiatedBy,
        metadata: request.metadata,
        completedAt: new Date()
      }
    });

    // Record auto-approval action
    await prisma.approvalAction.create({
      data: {
        instanceId: instance.id,
        stepNumber: 0,
        approverId: 'SYSTEM',
        action: ApprovalActionType.APPROVE,
        comments: 'Auto-approved based on workflow rules'
      }
    });

    await auditService.logEvent('APPROVAL_AUTO_APPROVED', instance.id, {
      requestId: request.requestId,
      rules: workflow.autoApprovalRules
    });

    return instance;
  }

  private async canApproveStep(step: ApprovalStep, userId: string): Promise<boolean> {
    if (step.approverUserId === userId) {
      return true;
    }

    if (step.approverRole) {
      const userRoles = await this.getUserRoles(userId);
      return userRoles.includes(step.approverRole);
    }

    return false;
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Role: true }
    });

    return user?.Role.map(role => role.name) || [];
  }

  private async notifyNextApprover(instance: ApprovalInstance): Promise<void> {
    const currentStep = instance.workflow.steps.find(s => s.stepNumber === instance.currentStep);

    if (!currentStep) return;

    let approverEmails: string[] = [];

    if (currentStep.approverUserId) {
      const user = await prisma.user.findUnique({
        where: { id: currentStep.approverUserId }
      });
      if (user?.email) {
        approverEmails.push(user.email);
      }
    } else if (currentStep.approverRole) {
      const users = await prisma.user.findMany({
        where: {
          Role: {
            some: {
              name: currentStep.approverRole
            }
          }
        }
      });
      approverEmails = users.map(u => u.email).filter(Boolean) as string[];
    }

    if (approverEmails.length > 0) {
      const message = `You have a new approval request pending: ${instance.metadata?.title || 'Approval Required'}`;
      await sendNotification('email', approverEmails[0], 'Approval Request', message);
    }
  }

  private async handleEscalation(instance: ApprovalInstance, decision: ApprovalDecision): Promise<void> {
    const currentStep = instance.workflow.steps.find(s => s.stepNumber === instance.currentStep);

    if (!currentStep?.escalationRole) {
      throw new Error('No escalation role defined for this step');
    }

    // Update step to escalate to the escalation role
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        approverRole: currentStep.escalationRole,
        approverUserId: null
      }
    });

    // Notify escalation role members
    const escalationUsers = await prisma.user.findMany({
      where: {
        Role: {
          some: {
            name: currentStep.escalationRole
          }
        }
      }
    });

    const emails = escalationUsers.map(u => u.email).filter(Boolean) as string[];
    if (emails.length > 0) {
      const message = `Escalated approval request: ${instance.metadata?.title || 'Approval Required'}`;
      await sendNotification('email', emails[0], 'Escalated Approval Request', message);
    }
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();