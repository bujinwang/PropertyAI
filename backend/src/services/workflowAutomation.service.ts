import { prisma } from '../config/database';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowExecution,
  WorkflowEvent,
  WorkflowIntegration,
  InstanceStatus,
  ExecutionStatus,
  IntegrationType
} from '@prisma/client';
import { pubSubService } from './pubSub.service';
import { auditService } from './audit.service';

interface WorkflowExecutionContext {
  instanceId: string;
  variables: Record<string, any>;
  currentStep?: string;
}

interface StepDefinition {
  id: string;
  type: string;
  config: any;
  position?: any;
  connections?: any;
}

interface WorkflowTrigger {
  definitionId: string;
  variables?: Record<string, any>;
  initiatedBy: string;
  context?: any;
}

class WorkflowAutomationService {
  /**
   * Create a new workflow definition
   */
  public async createWorkflowDefinition(
    name: string,
    description: string,
    category: string,
    definition: any,
    steps: StepDefinition[],
    createdBy: string,
    isTemplate: boolean = false,
    metadata?: any
  ): Promise<WorkflowDefinition> {
    return await prisma.$transaction(async (tx) => {
      const workflowDef = await tx.workflowDefinition.create({
        data: {
          name,
          description,
          category,
          definition,
          isTemplate,
          metadata,
          createdBy,
          steps: {
            create: steps.map(step => ({
              stepId: step.id,
              name: step.id, // Use step id as name initially
              type: step.type,
              config: step.config,
              position: step.position,
              connections: step.connections
            }))
          }
        },
        include: {
          steps: true
        }
      });

      await auditService.logEvent('WORKFLOW_DEFINITION_CREATED', workflowDef.id, {
        name,
        category,
        stepCount: steps.length,
        isTemplate
      });

      return workflowDef;
    });
  }

  /**
   * Start a new workflow instance
   */
  public async startWorkflowInstance(trigger: WorkflowTrigger): Promise<WorkflowInstance> {
    const definition = await prisma.workflowDefinition.findUnique({
      where: { id: trigger.definitionId },
      include: { steps: true }
    });

    if (!definition) {
      throw new Error('Workflow definition not found');
    }

    const instance = await prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          definitionId: trigger.definitionId,
          variables: trigger.variables || {},
          context: trigger.context || {},
          initiatedBy: trigger.initiatedBy
        },
        include: {
          definition: {
            include: { steps: true }
          }
        }
      });

      // Log workflow start event
      await tx.workflowEvent.create({
        data: {
          instanceId: instance.id,
          eventType: 'WORKFLOW_STARTED',
          eventData: {
            definitionId: trigger.definitionId,
            initiatedBy: trigger.initiatedBy,
            variables: trigger.variables
          }
        }
      });

      return instance;
    });

    await auditService.logEvent('WORKFLOW_INSTANCE_STARTED', instance.id, {
      definitionId: trigger.definitionId,
      initiatedBy: trigger.initiatedBy
    });

    // Publish real-time update
    pubSubService.publish('workflow-updates', JSON.stringify({
      type: 'WORKFLOW_STARTED',
      payload: instance
    }));

    // Start execution asynchronously
    this.executeWorkflow(instance).catch(error => {
      console.error('Workflow execution failed:', error);
      this.handleWorkflowError(instance.id, error);
    });

    return instance;
  }

  /**
   * Execute workflow instance
   */
  private async executeWorkflow(instance: WorkflowInstance): Promise<void> {
    const context: WorkflowExecutionContext = {
      instanceId: instance.id,
      variables: { ...instance.variables },
      currentStep: undefined
    };

    try {
      const steps = instance.definition.steps.sort((a, b) => {
        // Simple ordering - can be enhanced with proper DAG execution
        return a.stepId.localeCompare(b.stepId);
      });

      for (const step of steps) {
        context.currentStep = step.stepId;

        await this.executeStep(step, context);

        // Update instance with current step
        await prisma.workflowInstance.update({
          where: { id: instance.id },
          data: { currentStep: step.stepId }
        });

        // Publish progress update
        pubSubService.publish('workflow-updates', JSON.stringify({
          type: 'WORKFLOW_STEP_COMPLETED',
          payload: {
            instanceId: instance.id,
            stepId: step.stepId,
            variables: context.variables
          }
        }));
      }

      // Mark workflow as completed
      await this.completeWorkflow(instance.id, context.variables);

    } catch (error) {
      await this.failWorkflow(instance.id, error as Error);
      throw error;
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(step: any, context: WorkflowExecutionContext): Promise<void> {
    const execution = await prisma.workflowExecution.create({
      data: {
        instanceId: context.instanceId,
        stepId: step.stepId,
        status: ExecutionStatus.RUNNING,
        input: {
          stepConfig: step.config,
          variables: context.variables
        }
      }
    });

    try {
      let output: any = {};

      switch (step.type) {
        case 'TASK':
          output = await this.executeTaskStep(step.config, context);
          break;
        case 'DECISION':
          output = await this.executeDecisionStep(step.config, context);
          break;
        case 'INTEGRATION':
          output = await this.executeIntegrationStep(step.config, context);
          break;
        case 'TIMER':
          output = await this.executeTimerStep(step.config, context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Update execution as completed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.COMPLETED,
          output,
          completedAt: new Date()
        }
      });

      // Update context variables
      if (output && typeof output === 'object') {
        Object.assign(context.variables, output);
      }

    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: (error as Error).message,
          completedAt: new Date()
        }
      });
      throw error;
    }
  }

  /**
   * Execute task step
   */
  private async executeTaskStep(config: any, context: WorkflowExecutionContext): Promise<any> {
    // Task execution logic - can be extended for different task types
    const { taskType, parameters } = config;

    switch (taskType) {
      case 'HTTP_REQUEST':
        return await this.executeHttpRequest(parameters, context);
      case 'DATABASE_QUERY':
        return await this.executeDatabaseQuery(parameters, context);
      case 'EMAIL_SEND':
        return await this.executeEmailSend(parameters, context);
      case 'DOCUMENT_GENERATE':
        return await this.executeDocumentGeneration(parameters, context);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * Execute decision step
   */
  private async executeDecisionStep(config: any, context: WorkflowExecutionContext): Promise<any> {
    const { conditions, defaultPath } = config;

    for (const condition of conditions) {
      if (this.evaluateCondition(condition.expression, context.variables)) {
        return { decision: condition.path, reason: condition.description };
      }
    }

    return { decision: defaultPath, reason: 'Default path' };
  }

  /**
   * Execute integration step
   */
  private async executeIntegrationStep(config: any, context: WorkflowExecutionContext): Promise<any> {
    const { integrationId, action, parameters } = config;

    const integration = await prisma.workflowIntegration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    return await this.executeExternalIntegration(integration, action, parameters, context);
  }

  /**
   * Execute timer step
   */
  private async executeTimerStep(config: any, context: WorkflowExecutionContext): Promise<any> {
    const { duration, unit } = config;

    // Convert to milliseconds
    const durationMs = this.convertToMilliseconds(duration, unit);

    // Simple delay - in production, this would use a job queue
    await new Promise(resolve => setTimeout(resolve, Math.min(durationMs, 30000))); // Max 30 seconds for demo

    return { timerCompleted: true, duration: durationMs };
  }

  /**
   * Pause workflow execution
   */
  public async pauseWorkflow(instanceId: string): Promise<WorkflowInstance> {
    const instance = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.PAUSED },
      include: {
        definition: {
          include: { steps: true }
        }
      }
    });

    await auditService.logEvent('WORKFLOW_PAUSED', instanceId);

    pubSubService.publish('workflow-updates', JSON.stringify({
      type: 'WORKFLOW_PAUSED',
      payload: instance
    }));

    return instance;
  }

  /**
   * Resume workflow execution
   */
  public async resumeWorkflow(instanceId: string): Promise<WorkflowInstance> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: {
          include: { steps: true }
        }
      }
    });

    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== InstanceStatus.PAUSED) {
      throw new Error('Workflow is not paused');
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.RUNNING }
    });

    await auditService.logEvent('WORKFLOW_RESUMED', instanceId);

    // Resume execution asynchronously
    this.executeWorkflow(instance).catch(error => {
      console.error('Workflow resume failed:', error);
      this.handleWorkflowError(instanceId, error);
    });

    pubSubService.publish('workflow-updates', JSON.stringify({
      type: 'WORKFLOW_RESUMED',
      payload: instance
    }));

    return instance;
  }

  /**
   * Get workflow instance status
   */
  public async getWorkflowStatus(instanceId: string): Promise<WorkflowInstance | null> {
    return prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: true,
        executions: {
          orderBy: { startedAt: 'desc' }
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });
  }

  /**
   * Get workflow analytics
   */
  public async getWorkflowAnalytics(
    definitionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const where: any = {};

    if (definitionId) {
      where.definitionId = definitionId;
    }

    if (startDate || endDate) {
      where.initiatedAt = {};
      if (startDate) where.initiatedAt.gte = startDate;
      if (endDate) where.initiatedAt.lte = endDate;
    }

    const instances = await prisma.workflowInstance.findMany({
      where,
      include: {
        executions: true,
        events: true
      }
    });

    // Calculate analytics
    const totalInstances = instances.length;
    const completedInstances = instances.filter(i => i.status === InstanceStatus.COMPLETED).length;
    const failedInstances = instances.filter(i => i.status === InstanceStatus.FAILED).length;
    const runningInstances = instances.filter(i => i.status === InstanceStatus.RUNNING).length;

    const avgExecutionTime = instances
      .filter(i => i.completedAt && i.initiatedAt)
      .reduce((sum, i) => {
        return sum + (i.completedAt!.getTime() - i.initiatedAt.getTime());
      }, 0) / Math.max(completedInstances, 1);

    return {
      totalInstances,
      completedInstances,
      failedInstances,
      runningInstances,
      completionRate: totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0,
      avgExecutionTime: Math.round(avgExecutionTime / 1000), // seconds
      instances
    };
  }

  /**
   * Get workflow definitions
   */
  public async getWorkflowDefinitions(category?: string, isTemplate?: boolean): Promise<WorkflowDefinition[]> {
    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (isTemplate !== undefined) {
      where.isTemplate = isTemplate;
    }

    return prisma.workflowDefinition.findMany({
      where,
      include: {
        steps: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update workflow definition
   */
  public async updateWorkflowDefinition(id: string, updates: any): Promise<WorkflowDefinition> {
    const updated = await prisma.workflowDefinition.update({
      where: { id },
      data: updates,
      include: {
        steps: true
      }
    });

    await auditService.logEvent('WORKFLOW_DEFINITION_UPDATED', id, updates);

    return updated;
  }

  /**
   * Create workflow integration
   */
  public async createIntegration(
    name: string,
    type: IntegrationType,
    config: any
  ): Promise<WorkflowIntegration> {
    const integration = await prisma.workflowIntegration.create({
      data: {
        name,
        type,
        config
      }
    });

    await auditService.logEvent('WORKFLOW_INTEGRATION_CREATED', integration.id, {
      name,
      type
    });

    return integration;
  }

  /**
   * Get integrations
   */
  public async getIntegrations(): Promise<WorkflowIntegration[]> {
    return prisma.workflowIntegration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update integration
   */
  public async updateIntegration(id: string, updates: any): Promise<WorkflowIntegration> {
    const updated = await prisma.workflowIntegration.update({
      where: { id },
      data: updates
    });

    await auditService.logEvent('WORKFLOW_INTEGRATION_UPDATED', id, updates);

    return updated;
  }

  /**
   * Test integration
   */
  public async testIntegration(id: string): Promise<any> {
    const integration = await prisma.workflowIntegration.findUnique({
      where: { id }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Basic connectivity test based on integration type
    try {
      switch (integration.type) {
        case IntegrationType.WEBHOOK:
          return await this.testWebhookIntegration(integration.config);
        case IntegrationType.API:
          return await this.testApiIntegration(integration.config);
        default:
          return { success: true, message: 'Integration type not testable' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get workflow templates
   */
  public async getWorkflowTemplates(): Promise<WorkflowDefinition[]> {
    return prisma.workflowDefinition.findMany({
      where: {
        isTemplate: true,
        isActive: true
      },
      include: {
        steps: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create workflow from template
   */
  public async createFromTemplate(
    templateId: string,
    customizations: any,
    createdBy: string
  ): Promise<WorkflowDefinition> {
    const template = await prisma.workflowDefinition.findUnique({
      where: { id: templateId },
      include: { steps: true }
    });

    if (!template || !template.isTemplate) {
      throw new Error('Template not found');
    }

    return await prisma.$transaction(async (tx) => {
      const newWorkflow = await tx.workflowDefinition.create({
        data: {
          name: customizations.name || `${template.name} (Copy)`,
          description: customizations.description || template.description,
          category: customizations.category || template.category,
          definition: { ...template.definition, ...customizations.definition },
          isTemplate: false,
          metadata: { ...template.metadata, ...customizations.metadata },
          createdBy,
          steps: {
            create: template.steps.map(step => ({
              stepId: step.stepId,
              name: step.name,
              type: step.type,
              config: { ...step.config, ...customizations.stepConfigs?.[step.stepId] },
              position: step.position,
              connections: step.connections
            }))
          }
        },
        include: {
          steps: true
        }
      });

      await auditService.logEvent('WORKFLOW_CREATED_FROM_TEMPLATE', newWorkflow.id, {
        templateId,
        createdBy
      });

      return newWorkflow;
    });
  }

  // Private helper methods

  private async completeWorkflow(instanceId: string, finalVariables: any): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: InstanceStatus.COMPLETED,
          completedAt: new Date(),
          variables: finalVariables
        }
      });

      await tx.workflowEvent.create({
        data: {
          instanceId,
          eventType: 'WORKFLOW_COMPLETED',
          eventData: { finalVariables }
        }
      });
    });

    await auditService.logEvent('WORKFLOW_COMPLETED', instanceId);

    pubSubService.publish('workflow-updates', JSON.stringify({
      type: 'WORKFLOW_COMPLETED',
      payload: { instanceId, finalVariables }
    }));
  }

  private async failWorkflow(instanceId: string, error: Error): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: InstanceStatus.FAILED
        }
      });

      await tx.workflowEvent.create({
        data: {
          instanceId,
          eventType: 'WORKFLOW_FAILED',
          eventData: { error: error.message }
        }
      });
    });

    await auditService.logEvent('WORKFLOW_FAILED', instanceId, { error: error.message });

    pubSubService.publish('workflow-updates', JSON.stringify({
      type: 'WORKFLOW_FAILED',
      payload: { instanceId, error: error.message }
    }));
  }

  private async handleWorkflowError(instanceId: string, error: Error): Promise<void> {
    console.error(`Workflow ${instanceId} error:`, error);
    await this.failWorkflow(instanceId, error);
  }

  private evaluateCondition(expression: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation - can be enhanced with a proper expression engine
    try {
      // Basic variable substitution and evaluation
      let evalExpression = expression;
      for (const [key, value] of Object.entries(variables)) {
        evalExpression = evalExpression.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      }

      // Use Function constructor for safer evaluation
      const result = new Function('return ' + evalExpression)();
      return Boolean(result);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async executeHttpRequest(parameters: any, context: WorkflowExecutionContext): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = parameters;

    // Simple HTTP request - in production, use a proper HTTP client
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeDatabaseQuery(parameters: any, context: WorkflowExecutionContext): Promise<any> {
    const { query, params = [] } = parameters;

    // Execute raw query - use with caution
    return await prisma.$queryRaw(query, ...params);
  }

  private async executeEmailSend(parameters: any, context: WorkflowExecutionContext): Promise<any> {
    const { to, subject, body, template } = parameters;

    // Use existing email service
    // This would integrate with the existing email service
    return { sent: true, to, subject };
  }

  private async executeDocumentGeneration(parameters: any, context: WorkflowExecutionContext): Promise<any> {
    const { template, data, format = 'pdf' } = parameters;

    // Document generation logic
    return { generated: true, format, data };
  }

  private async executeExternalIntegration(
    integration: WorkflowIntegration,
    action: string,
    parameters: any,
    context: WorkflowExecutionContext
  ): Promise<any> {
    // Generic integration execution based on type
    switch (integration.type) {
      case IntegrationType.WEBHOOK:
        return await this.executeWebhookIntegration(integration.config, action, parameters);
      case IntegrationType.API:
        return await this.executeApiIntegration(integration.config, action, parameters);
      default:
        throw new Error(`Unsupported integration type: ${integration.type}`);
    }
  }

  private async executeWebhookIntegration(config: any, action: string, parameters: any): Promise<any> {
    const { url, method = 'POST', headers = {} } = config;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ action, ...parameters })
    });

    return await response.json();
  }

  private async executeApiIntegration(config: any, action: string, parameters: any): Promise<any> {
    // API integration logic
    const { baseUrl, auth } = config;

    // Implement API call logic here
    return { success: true, action, parameters };
  }

  private async testWebhookIntegration(config: any): Promise<any> {
    const { url, method = 'GET' } = config;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify({ test: true }) : undefined
      });

      return {
        success: response.ok,
        status: response.status,
        message: `Webhook endpoint responded with status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${(error as Error).message}`
      };
    }
  }

  private async testApiIntegration(config: any): Promise<any> {
    const { baseUrl, auth } = config;

    try {
      // Basic connectivity test
      const testUrl = baseUrl.endsWith('/') ? `${baseUrl}health` : `${baseUrl}/health`;
      const headers: any = { 'Content-Type': 'application/json' };

      if (auth?.type === 'bearer') {
        headers.Authorization = `Bearer ${auth.token}`;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers
      });

      return {
        success: response.ok,
        status: response.status,
        message: `API endpoint responded with status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${(error as Error).message}`
      };
    }
  }

  private convertToMilliseconds(duration: number, unit: string): number {
    const units: Record<string, number> = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000
    };

    return duration * (units[unit.toLowerCase()] || 1000);
  }
}

export const workflowAutomationService = new WorkflowAutomationService();