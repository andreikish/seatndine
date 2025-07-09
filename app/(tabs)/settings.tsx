import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme } from '../config/theme';

type SettingSection = {
  title: string;
  items: SettingItem[];
};

type SettingItem = {
  title: string;
  icon: 'moon.fill' | 'bell.fill' | 'questionmark.circle.fill' | 'envelope.fill' | 'lock.fill' | 'person.crop.circle.fill' | 'rectangle.portrait.and.arrow.right.fill';
  action: () => void;
  type?: 'switch' | 'link';
  value?: boolean;
};

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const theme = isDarkMode ? darkTheme : lightTheme;

  const settings: SettingSection[] = [
    {
      title: 'Aspect',
      items: [
        {
          title: 'Mod Întunecat',
          icon: 'moon.fill',
          action: toggleTheme,
          type: 'switch',
          value: isDarkMode,
        },
      ],
    },
    {
      title: 'Cont',
      items: [
        {
          title: 'Card de Membru',
          icon: 'person.crop.circle.fill',
          action: () => router.push('/membership-card'),
        },
        {
          title: 'Notificări',
          icon: 'bell.fill',
          action: () => router.push('/notifications'),
        },
      ],
    },
    {
      title: 'Suport',
      items: [
        {
          title: 'Centru de Ajutor',
          icon: 'questionmark.circle.fill',
          action: () => router.push('/help-center'),
        },
        {
          title: 'Contactează-ne',
          icon: 'envelope.fill',
          action: () => router.push('/contact-us'),
        },
        {
          title: 'Politica de Confidențialitate',
          icon: 'lock.fill',
          action: () => router.push('/privacy-policy'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={[styles.scrollView, { paddingTop: insets.top }]}>

        <View style={[styles.profileSection, { backgroundColor: theme.colors.card }]}>
          <Image
            source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
          <Text style={[styles.profileName, { color: theme.colors.text }]}>
            {user?.user_metadata?.full_name || 'User Name'}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.colors.placeholder }]}>
            {user?.email || 'user@example.com'}
          </Text>
          <View style={styles.profileActions}>
            <TouchableOpacity 
              style={[styles.profileActionButton, { backgroundColor: '#FF9500' }]}
              onPress={() => router.push('/profile')}
            >
              <IconSymbol name="person.crop.circle.fill" size={24} color="#FFFFFF" />
              <Text style={[styles.profileActionText, { color: '#FFFFFF' }]}>Profil</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileActionButton, { backgroundColor: '#FF3B30' }]}
              onPress={signOut}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={24} color="#FFFFFF" />
              <Text style={[styles.profileActionText, { color: '#FFFFFF' }]}>Deconectare</Text>
            </TouchableOpacity>
          </View>
        </View>

        {settings.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.placeholder }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.colors.card }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && styles.settingItemBorder,
                    { borderBottomColor: theme.colors.border }
                  ]}
                  onPress={item.action}
                >
                  <View style={styles.settingItemLeft}>
                    <IconSymbol name={item.icon as any} size={24} color={theme.colors.text} />
                    <Text style={[styles.settingItemText, { color: theme.colors.text }]}>
                      {item.title}
                    </Text>
                  </View>
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.action}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor={theme.colors.card}
                    />
                  ) : (
                    <IconSymbol name="chevron.right" size={20} color={theme.colors.placeholder} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 