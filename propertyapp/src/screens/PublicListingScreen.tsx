import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type PublicListingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const PublicListingScreen: React.FC = () => {
  const navigation = useNavigation<PublicListingNavigationProp>();
  const route = useRoute();
  const { listingId } = route.params as { listingId: string };

  const handleApply = () => {
    // Navigate to login/register screen, then to application
    navigation.navigate('Login', { screen: 'Application', params: { listingId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mock data for now */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800' }} style={styles.propertyImage} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Modern Downtown Apartment</Text>
          <Text style={styles.address}>123 Main Street, Downtown, NY 10001</Text>
          <Button
            title="Apply Now"
            variant="primary"
            onPress={handleApply}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});

export default PublicListingScreen;