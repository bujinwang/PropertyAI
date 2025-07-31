import React, { useEffect, useState } from 'react';
import { Avatar, Badge, Box, Tooltip, Typography } from '@mui/material';
import { FiberManualRecord as OnlineIcon } from '@mui/icons-material';

interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  isTyping?: boolean;
  currentReviewId?: string;
}

interface UXPresenceIndicatorProps {
  reviewId?: string;
  showTyping?: boolean;
  maxAvatars?: number;
  onUserClick?: (userId: string) => void;
}

export const UXPresenceIndicator: React.FC<UXPresenceIndicatorProps> = ({
  reviewId,
  showTyping = true,
  maxAvatars = 3,
  onUserClick,
}) => {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Simulate real-time presence updates
  useEffect(() => {
    // In real implementation, this would connect to WebSocket
    const mockPresences: UserPresence[] = [
      {
        id: '1',
        name: 'Alice Johnson',
        avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
        status: 'online',
        isTyping: true,
        currentReviewId: reviewId,
      },
      {
        id: '2',
        name: 'Bob Smith',
        avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=random',
        status: 'away',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        currentReviewId: reviewId,
      },
      {
        id: '3',
        name: 'Carol Davis',
        avatar: 'https://ui-avatars.com/api/?name=Carol+Davis&background=random',
        status: 'busy',
        currentReviewId: reviewId,
      },
    ];

    setPresences(mockPresences.filter(p => !reviewId || p.currentReviewId === reviewId));

    // Simulate WebSocket updates
    const interval = setInterval(() => {
      setPresences(prev => prev.map(p => ({
        ...p,
        isTyping: Math.random() > 0.8,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [reviewId]);

  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'away': return '#ff9800';
      case 'busy': return '#f44336';
      case 'offline': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: UserPresence['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const displayedPresences = showAll ? presences : presences.slice(0, maxAvatars);
  const hiddenCount = presences.length - maxAvatars;

  if (presences.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {reviewId ? 'Viewing:' : 'Active:'}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {displayedPresences.map((user) => (
          <Tooltip
            key={user.id}
            title={
              <Box>
                <Typography variant="body2">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getStatusLabel(user.status)}
                  {user.lastSeen && ` · ${Math.round((Date.now() - user.lastSeen.getTime()) / 60000)}m ago`}
                  {user.isTyping && ' · typing...'}
                </Typography>
              </Box>
            }
            arrow
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(user.status),
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                />
              }
            >
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  cursor: onUserClick ? 'pointer' : 'default',
                  border: user.isTyping ? '2px solid #1976d2' : 'none',
                  animation: user.isTyping ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
                onClick={() => onUserClick?.(user.id)}
              >
                {user.name.charAt(0)}
              </Avatar>
            </Badge>
          </Tooltip>
        ))}
        
        {!showAll && hiddenCount > 0 && (
          <Tooltip title={`+${hiddenCount} more users`} arrow>
            <Box
              onClick={() => setShowAll(true)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              +{hiddenCount}
            </Box>
          </Tooltip>
        )}
      </Box>

      {showAll && hiddenCount > 0 && (
        <Typography
          variant="caption"
          color="primary"
          sx={{ cursor: 'pointer', ml: 1 }}
          onClick={() => setShowAll(false)}
        >
          Show less
        </Typography>
      )}
    </Box>
  );
};