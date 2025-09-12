import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { dashboardService, Tenant, SendMessageData } from '../services/dashboardService';

interface MessageComposeProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRecipients?: string[];
  initialSubject?: string;
  replyToThreadId?: string;
  replyToSubject?: string;
}

const MessageCompose: React.FC<MessageComposeProps> = ({
  open,
  onClose,
  onSuccess,
  initialRecipients = [],
  initialSubject = '',
  replyToThreadId,
  replyToSubject,
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(initialRecipients);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recipientInput, setRecipientInput] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setContent('');
      setSelectedRecipients(initialRecipients);
      setAttachments([]);
      setRecipientInput('');
    }
  }, [open, initialRecipients, initialSubject]);

  // Fetch tenants for recipient selection
  const {
    data: tenantsData,
    isLoading: tenantsLoading,
  } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => dashboardService.getTenants(1, 100),
    enabled: open,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageData) => dashboardService.sendMessage(data),
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !content.trim() || selectedRecipients.length === 0) {
      return;
    }

    const messageData: SendMessageData = {
      recipientIds: selectedRecipients,
      subject: subject.trim(),
      content: content.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      threadId: replyToThreadId,
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset input
    event.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRecipient = (tenantId: string) => {
    if (!selectedRecipients.includes(tenantId)) {
      setSelectedRecipients(prev => [...prev, tenantId]);
    }
    setRecipientInput('');
  };

  const handleRemoveRecipient = (tenantId: string) => {
    setSelectedRecipients(prev => prev.filter(id => id !== tenantId));
  };

  const getTenantName = (tenantId: string) => {
    const tenant = tenantsData?.data?.find(t => t.id === tenantId);
    return tenant ? tenant.name : tenantId;
  };

  const filteredTenants = tenantsData?.data?.filter(
    tenant =>
      !selectedRecipients.includes(tenant.id) &&
      tenant.name.toLowerCase().includes(recipientInput.toLowerCase())
  ) || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' },
      }}
      aria-labelledby="compose-message-title"
      aria-describedby="compose-message-description"
    >
      <DialogTitle id="compose-message-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {replyToThreadId ? 'Reply to Conversation' : 'Compose Message'}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close compose message dialog">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Typography id="compose-message-description" sx={{ display: 'none' }}>
        {replyToThreadId ? 'Reply to an existing conversation with tenants' : 'Compose a new message to send to tenants'}
      </Typography>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Recipients */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recipients
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {selectedRecipients.map(recipientId => (
                <Chip
                  key={recipientId}
                  label={getTenantName(recipientId)}
                  onDelete={() => handleRemoveRecipient(recipientId)}
                  size="small"
                />
              ))}
            </Box>
            <Autocomplete
              options={filteredTenants}
              getOptionLabel={(tenant) => tenant.name}
              onChange={(_, tenant) => {
                if (tenant) {
                  handleAddRecipient(tenant.id);
                }
              }}
              inputValue={recipientInput}
              onInputChange={(_, value) => setRecipientInput(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search tenants..."
                  size="small"
                  fullWidth
                />
              )}
              loading={tenantsLoading}
              noOptionsText="No tenants found"
            />
          </Box>

          {/* Subject */}
          <TextField
            label="Subject"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={!!replyToThreadId}
          />

          {/* Message Content */}
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Type your message here..."
          />

          {/* Attachments */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">Attachments</Typography>
              <Button
                component="label"
                startIcon={<AttachFileIcon />}
                size="small"
                variant="outlined"
              >
                Add Files
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </Button>
            </Box>

            {attachments.length > 0 && (
              <List dense>
                {attachments.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveAttachment(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {sendMessageMutation.isError && (
            <Alert severity="error">
              Failed to send message. Please try again.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={sendMessageMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={
            !subject.trim() ||
            !content.trim() ||
            selectedRecipients.length === 0 ||
            sendMessageMutation.isPending
          }
          startIcon={
            sendMessageMutation.isPending ? (
              <CircularProgress size={16} />
            ) : (
              <SendIcon />
            )
          }
        >
          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageCompose;