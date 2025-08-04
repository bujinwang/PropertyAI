import React from 'react';
import {
 Card,
 CardContent,
 Box,
 Skeleton,
 Grid,
 Chip,
 Stack,
} from '@mui/material';

interface UXReviewSkeletonProps {
 count?: number;
}

export const UXReviewSkeleton: React.FC<UXReviewSkeletonProps> = ({ count = 3 }) => {
 return (
  <Grid container spacing={3}>
   {Array.from({ length: count }).map((_, index) => (
    <Grid xs={12} sm={6} md={4} key={index}>
     <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
       {/* Header */}
       <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
         <Skeleton variant="circular" width={24} height={24} />
         <Skeleton variant="text" width={120} height={32} />
        </Box>
        <Skeleton variant="circular" width={32} height={32} />
       </Box>

       {/* Component Info */}
       <Box mb={2}>
        <Skeleton variant="text" width={180} height={20} />
        <Skeleton variant="text" width={140} height={20} />
       </Box>

       {/* Description */}
       <Box mb={2}>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
       </Box>

       {/* Tags */}
       <Box mb={2}>
        <Stack direction="row" spacing={1}>
         <Skeleton variant="rectangular" width={60} height={24} />
         <Skeleton variant="rectangular" width={50} height={24} />
         <Skeleton variant="rectangular" width={70} height={24} />
        </Stack>
       </Box>

       {/* Badges */}
       <Box display="flex" gap={1} mb={2}>
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="rectangular" width={70} height={24} />
        <Skeleton variant="rectangular" width={60} height={24} />
       </Box>

       {/* Footer */}
       <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
         <Skeleton variant="circular" width={24} height={24} />
         <Skeleton variant="text" width={80} height={16} />
        </Box>
        <Skeleton variant="text" width={60} height={16} />
       </Box>
      </CardContent>
     </Card>
    </Grid>
   ))}
  </Grid>
 );
};