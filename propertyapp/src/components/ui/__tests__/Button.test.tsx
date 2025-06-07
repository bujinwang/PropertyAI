import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  test('renders correctly with default props', () => {
    const { getByText } = render(<Button title="Test Button" />);
    const buttonText = getByText('Test Button');
    expect(buttonText).toBeTruthy();
  });

  test('calls onPress function when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPressMock} />
    );
    const button = getByText('Press Me');
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  test('renders with different variants', () => {
    const { getByText, rerender } = render(
      <Button title="Primary Button" variant="primary" />
    );
    
    // Test primary variant
    expect(getByText('Primary Button')).toBeTruthy();
    
    // Test secondary variant
    rerender(<Button title="Secondary Button" variant="secondary" />);
    expect(getByText('Secondary Button')).toBeTruthy();
    
    // Test outline variant
    rerender(<Button title="Outline Button" variant="outline" />);
    expect(getByText('Outline Button')).toBeTruthy();
  });
}); 