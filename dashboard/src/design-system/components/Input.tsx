import React from 'react';
import { TextField as MuiTextField, TextFieldProps } from '@mui/material';

const Input: React.FC<TextFieldProps> = (props) => {
  return <MuiTextField {...props} variant="outlined" fullWidth />;
};

export default Input;
