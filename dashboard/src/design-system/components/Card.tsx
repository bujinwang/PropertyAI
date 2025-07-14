import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, CardProps } from '@mui/material';

interface CustomCardProps extends CardProps {
  title?: string;
}

const Card: React.FC<CustomCardProps> = ({ title, children, ...props }) => {
  return (
    <MuiCard {...props}>
      {title && <CardHeader title={title} />}
      <CardContent>{children}</CardContent>
    </MuiCard>
  );
};

export default Card;
