import React, { useState, useEffect } from 'react';

// API service for templates
const templatesApi = {
  getAccessibleTemplates: async (role?: string) => {
    const url = role ? `/api/templates/accessible?role=${role}` : '/api/templates/accessible';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch accessible templates');
    return response.json();
  },

  applyTemplate: async (layout: any, availableComponents: string[]) => {
    const response = await fetch('/api/templates/apply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ layout, availableComponents })
    });
    if (!response.ok) throw new Error('Failed to apply template');
    return response.json();
  }
};

interface TemplateApplierProps {
  children: React.ReactNode;
  templateId?: string; // If specific template
  userId: string;
  role: string;
  availableComponents: string[]; // e.g., ['MaintenanceAlerts', 'Chart']
}

// Higher-order component to apply template layout
const TemplateApplier: React.FC<TemplateApplierProps> = ({ children, templateId, userId, role, availableComponents }) => {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        if (templateId) {
          // Get accessible templates and find the specific one
          const templates = await templatesApi.getAccessibleTemplates(role);
          const template = templates.data.find((t: any) => t.id === templateId);

          if (template) {
            // Apply template layout with validation
            const validated = await templatesApi.applyTemplate(template.layout, availableComponents);
            setLayout(validated.data);
          } else {
            // Fallback to default layout
            setLayout([{ type: 'default', position: 'default' }]);
          }
        } else {
          // Default layout if no template
          setLayout([{ type: 'default', position: 'default' }]);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        // Fallback to default layout on error
        setLayout([{ type: 'default', position: 'default' }]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, userId, role, availableComponents]);

  if (loading) return <div>Loading template...</div>;

  if (!layout) return <>{children}</>; // Fallback to children

  // Render components based on layout JSON
  const renderLayout = (layoutArray: any[]) => (
    <div className="template-layout">
      {layoutArray.map((item, index) => {
        // Note: Component imports would need to be added for actual components
        // For now, using placeholder components
        if (item.type === 'alerts') return <div key={index}>Maintenance Alerts Component</div>;
        if (item.type === 'chart') return <div key={index}>Chart Component</div>;
        if (item.type === 'table') return <div key={index}>Table Component</div>;
        return <div key={index}>{children}</div>; // Default to children
      })}
    </div>
  );

  return renderLayout(layout || [{ type: 'default' }]);
};

export default TemplateApplier;
