import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Slider,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  ResponseSettings,
  EscalationRule,
  ResponseTrigger,
  EscalationCondition,
  RESPONSE_TRIGGER_OPTIONS,
  ESCALATION_CONDITION_OPTIONS
} from '../../types/communication-training';

interface AutomatedResponseSettingsProps {
  settings: ResponseSettings;
  onSettingsChange: (settings: ResponseSettings) => void;
  isLoading?: boolean;
}

const AutomatedResponseSettings: React.FC<AutomatedResponseSettingsProps> = ({
  settings,
  onSettingsChange,
  isLoading = false
}) => {
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<EscalationRule>>({});

  const handleTriggerChange = (event: SelectChangeEvent<ResponseTrigger[]>) => {
    const value = event.target.value as ResponseTrigger[];
    onSettingsChange({
      ...settings,
      triggers: value
    });
  };

  const handleDelayChange = (_: Event, value: number | number[]) => {
    onSettingsChange({
      ...settings,
      delayMinutes: value as number
    });
  };

  const handleMaxAttemptsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      maxAttempts: parseInt(event.target.value) || 1
    });
  };

  const handleBusinessHoursToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      businessHoursOnly: event.target.checked
    });
  };

  const handleAddRule = () => {
    setNewRule({
      condition: 'no_response_after_time',
      threshold: 30,
      action: 'escalate_to_human',
      priority: 'medium',
      enabled: true
    });
    setEditingRule(null);
    setIsRuleDialogOpen(true);
  };

  const handleEditRule = (rule: EscalationRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setIsRuleDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    onSettingsChange({
      ...settings,
      escalationRules: settings.escalationRules.filter(rule => rule.id !== ruleId)
    });
  };

  const handleSaveRule = () => {
    if (!newRule.condition || !newRule.action) return;

    const rule: EscalationRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      condition: newRule.condition,
      threshold: newRule.threshold || 30,
      action: newRule.action,
      priority: newRule.priority || 'medium',
      enabled: newRule.enabled !== false
    };

    if (editingRule) {
      // Update existing rule
      onSettingsChange({
        ...settings,
        escalationRules: settings.escalationRules.map(r => 
          r.id === editingRule.id ? rule : r
        )
      });
    } else {
      // Add new rule
      onSettingsChange({
        ...settings,
        escalationRules: [...settings.escalationRules, rule]
      });
    }

    setIsRuleDialogOpen(false);
    setNewRule({});
    setEditingRule(null);
  };

  const handleToggleRule = (ruleId: string) => {
    onSettingsChange({
      ...settings,
      escalationRules: settings.escalationRules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    });
  };

  const formatDelayText = (value: number) => {
    if (value < 60) return `${value} minutes`;
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader
        title="Automated Response Settings"
        subheader="Configure when and how the AI responds to tenant communications"
      />
      <CardContent>
        {/* Response Triggers */}
        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel>Response Triggers</InputLabel>
            <Select
              multiple
              value={settings.triggers}
              onChange={handleTriggerChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = RESPONSE_TRIGGER_OPTIONS.find(opt => opt.value === value);
                    return (
                      <Chip
                        key={value}
                        label={option?.label || value}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {RESPONSE_TRIGGER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Response Delay */}
        <Box mb={3}>
          <Typography gutterBottom>
            Response Delay: {formatDelayText(settings.delayMinutes)}
          </Typography>
          <Slider
            value={settings.delayMinutes}
            onChange={handleDelayChange}
            min={0}
            max={240}
            step={5}
            marks={[
              { value: 0, label: 'Immediate' },
              { value: 30, label: '30m' },
              { value: 60, label: '1h' },
              { value: 120, label: '2h' },
              { value: 240, label: '4h' }
            ]}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            How long to wait before sending an automated response
          </Typography>
        </Box>

        {/* Additional Settings */}
        <Box mb={3}>
          <TextField
            label="Maximum Attempts"
            type="number"
            value={settings.maxAttempts}
            onChange={handleMaxAttemptsChange}
            inputProps={{ min: 1, max: 10 }}
            sx={{ mr: 2, width: 200 }}
            helperText="Max automated responses per conversation"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.businessHoursOnly}
                onChange={handleBusinessHoursToggle}
              />
            }
            label="Business Hours Only"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Escalation Rules */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Escalation Rules</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRule}
              variant="outlined"
              size="small"
            >
              Add Rule
            </Button>
          </Box>

          {settings.escalationRules.length === 0 ? (
            <Alert severity="info">
              No escalation rules configured. Add rules to automatically escalate conversations to human agents.
            </Alert>
          ) : (
            <Box>
              {settings.escalationRules.map((rule) => (
                <Card key={rule.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="subtitle2">
                            {ESCALATION_CONDITION_OPTIONS.find(opt => opt.value === rule.condition)?.label}
                          </Typography>
                          <Chip
                            label={rule.priority}
                            size="small"
                            color={
                              rule.priority === 'high' ? 'error' :
                              rule.priority === 'medium' ? 'warning' : 'default'
                            }
                          />
                          <Switch
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Threshold: {rule.threshold} {rule.condition.includes('time') ? 'minutes' : 'points'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Action: {rule.action.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditRule(rule)}
                          disabled={isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={isLoading}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Rule Dialog */}
        <Dialog open={isRuleDialogOpen} onClose={() => setIsRuleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRule ? 'Edit Escalation Rule' : 'Add Escalation Rule'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={newRule.condition || ''}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as EscalationCondition })}
                >
                  {ESCALATION_CONDITION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box>
                        <Typography variant="body2">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Threshold"
                type="number"
                value={newRule.threshold || ''}
                onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) || 0 })}
                fullWidth
                sx={{ mb: 2 }}
                helperText={
                  newRule.condition?.includes('time') 
                    ? 'Time in minutes' 
                    : 'Score threshold (0-100)'
                }
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={newRule.action || ''}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                >
                  <MenuItem value="escalate_to_human">Escalate to Human</MenuItem>
                  <MenuItem value="notify_manager">Notify Manager</MenuItem>
                  <MenuItem value="create_ticket">Create Ticket</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newRule.priority || 'medium'}
                  onChange={(e) => setNewRule({ ...newRule, priority: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={newRule.enabled !== false}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                  />
                }
                label="Enable this rule"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveRule}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!newRule.condition || !newRule.action}
            >
              Save Rule
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AutomatedResponseSettings;