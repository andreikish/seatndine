import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="gearshape.fill" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: session?.user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100' }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIconContainer}>
            <Image 
              source={{ uri: session?.user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/100' }}
              style={{ width: 16, height: 16, borderRadius: 8 }}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{session?.user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.email}>{session?.user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(settings)/edit-profile')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="person.2.fill" size={24} color="#666" />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/membership-card')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="person.crop.circle.fill" size={24} color="#666" />
            <Text style={styles.menuItemText}>Membership Card</Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="lock.fill" size={24} color="#666" />
            <Text style={styles.menuItemText}>Change Password</Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="heart.fill" size={24} color="#666" />
            <Text style={styles.menuItemText}>Favorite Restaurants</Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="calendar" size={24} color="#666" />
            <Text style={styles.menuItemText}>Reservation History</Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 