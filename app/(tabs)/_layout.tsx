import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from 'react-native-toast-message';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color='#003B73' />
            ),
            tabBarLabelStyle: {
              color: '#003B73', 
            },
          }}
        />
        <Tabs.Screen
          name="frequencia"
          options={{
            title: 'Presença',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color='#003B73'
              />
            ),
            tabBarLabelStyle: {
              color: '#003B73', 
            },
          }}
        />

        <Tabs.Screen
          name="consulta"
          options={{
            title: 'Consultas',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'clipboard-sharp' : 'clipboard-outline'}
                size={24}
                color='#003B73'
              />
            ),
            tabBarLabelStyle: {
              color: '#003B73', 
            },
          }}
        />
      </Tabs>
      <Toast /> 
    </View>
  );
}
