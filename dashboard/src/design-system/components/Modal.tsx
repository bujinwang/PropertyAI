import React from 'react';
import { Modal as MuiModal, Box, Typography, ModalProps } from '@mui/material';

interface CustomModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  children: React.ReactNode;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const Modal: React.FC<CustomModalProps> = ({ title, children, ...props }) => {
  return (
    <MuiModal {...props}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {children}
      </Box>
    </MuiModal>
  );
};

export default Modal;
