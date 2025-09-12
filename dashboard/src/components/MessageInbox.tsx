import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AttachFile as AttachFileIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, MessageThread } from '../services/dashboardService';

interface MessageInboxProps {
  onThreadSelect: (threadId: string) => void;
  selectedThreadId?: string;
}

const MessageInbox: React.FC<MessageInboxProps> = ({
  onThreadSelect,
  selectedThreadId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: threadsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messageThreads', debouncedSearch],
    queryFn: () => dashboardService.getMessageThreads(1, 50, debouncedSearch || undefined),
  });

  const handleThreadClick = (threadId: string) => {
    onThreadSelect(threadId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load messages. Please try again.
      </Alert>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Messages
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : threadsData?.data?.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {debouncedSearch ? 'No conversations found' : 'No messages yet'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {threadsData?.data?.map((thread: MessageThread, index: number) => (
              <React.Fragment key={thread.id}>
                <ListItemButton
                selected={selectedThreadId === thread.id}
                onClick={() => handleThreadClick(thread.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                aria-label={`Conversation with ${thread.participantNames?.join(', ') || 'Unknown'}. ${thread.unreadCount > 0 ? `${thread.unreadCount} unread messages.` : 'All messages read.'}`}
              >
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      variant={thread.unreadCount > 0 ? 'dot' : 'standard'}
                      overlap="circular"
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {thread.participantNames?.[0]
                          ? getInitials(thread.participantNames[0])
                          : <PersonIcon />
                        }
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: thread.unreadCount > 0 ? 600 : 400,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {thread.participantNames?.join(', ') || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(thread.lastMessageAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: thread.unreadCount > 0 ? 500 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {thread.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {thread.lastMessagePreview}
                          </Typography>
                          {thread.unreadCount > 0 && (
                            <Chip
                              label={thread.unreadCount}
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
                {index < (threadsData?.data?.length || 0) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default MessageInbox;