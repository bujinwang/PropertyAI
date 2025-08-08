import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Checkbox } from '@/components/ui/Checkbox';

interface ConsentFormProps {
  onConsent: () => void;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <View>
      <Text>
        I agree to the terms and conditions and authorize a background check.
      </Text>
      <Checkbox checked={agreed} onPress={() => setAgreed(v => !v)} />
      <Button
        title="Submit"
        onPress={onConsent}
        disabled={!agreed}
      />
    </View>
  );
};

export default ConsentForm;
