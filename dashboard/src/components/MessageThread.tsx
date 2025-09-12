import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, Message, MessageThread as MessageThreadType } from '../services/dashboardService';

interface MessageThreadProps {
  threadId: string;
  onComposeReply?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  threadId,
  onComposeReply,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    data: threadData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messageThread', threadId],
    queryFn: () => dashboardService.getMessageThread(threadId),
    enabled: !!threadId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => dashboardService.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: (data: { content: string; threadId: string }) =>
      dashboardService.sendMessage({
        recipientIds: threadData?.thread.participants.filter(id => id !== 'current-user') || [],
        subject: `Re: ${threadData?.thread.subject}`,
        content: data.content,
        threadId: data.threadId,
      }),
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['messageThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadData?.messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (threadData?.messages) {
      threadData.messages.forEach(message => {
        if (!message.isRead && message.recipientIds.includes('current-user')) {
          markAsReadMutation.mutate(message.id);
        }
      });
    }
  }, [threadData?.messages]);

  const handleSendReply = () => {
    if (!replyContent.trim() || !threadData) return;

    sendReplyMutation.mutate({
      content: replyContent,
      threadId: threadId,
    });
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await dashboardService.downloadMessageAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !threadData) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load conversation. Please try again.
      </Alert>
    );
  }

  const { thread, messages } = threadData;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Thread Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {thread.subject}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Participants:
          </Typography>
          {thread.participantNames?.map((name, index) => (
            <Chip
              key={index}
              label={name}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List sx={{ py: 0 }}>
          {messages.map((message: Message, index: number) => (
            <ListItem key={message.id} sx={{ alignItems: 'flex-start', px: 0 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {message.senderName
                    ? getInitials(message.senderName)
                    : <PersonIcon />
                  }
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2">
                      {message.senderName || 'Unknown Sender'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(message.sentAt)}
                    </Typography>
                    {message.hasAttachments && (
                      <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                      {message.content}
                    </Typography>
                    {message.attachments && message.attachments.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {message.attachments.map((attachment) => (
                          <Chip
                            key={attachment.id}
                            label={attachment.fileName}
                            size="small"
                            onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                            onDelete={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                            deleteIcon={<DownloadIcon />}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Section */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Reply to conversation
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendReply();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendReply}
            disabled={!replyContent.trim() || sendReplyMutation.isPending}
            sx={{ alignSelf: 'flex-end' }}
          >
            {sendReplyMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Ctrl+Enter to send
        </Typography>
      </Box>
    </Paper>
  );
};

export default MessageThread;