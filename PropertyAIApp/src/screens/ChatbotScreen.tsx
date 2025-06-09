import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('YOUR_GEMINI_API_KEY');

const ChatbotScreen: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; user: boolean }[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (input.trim() === '') return;

    setMessages([...messages, { text: input, user: true }]);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(input);
    const response = await result.response;
    const text = response.text();
    setMessages(prev => [...prev, { text, user: false }]);
    setInput('');
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <Text style={{ alignSelf: item.user ? 'flex-end' : 'flex-start' }}>
            {item.text}
          </Text>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: 'gray', marginRight: 10, padding: 5 }}
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

export default ChatbotScreen;
