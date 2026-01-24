import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
};

interface DashboardStats {
  catalogs: number;
  products: number;
  services: number;
  masters: number;
  orders: number;
  users: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    catalogs: 0,
    products: 0,
    services: 0,
    masters: 0,
    orders: 0,
    users: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    seedDemoData();
  }, []);

  const seedDemoData = async () => {
    try {
      await axios.post(`${API_URL}/api/seed`);
    } catch (error) {
      // Data might already exist
    }
  };

  const loadStats = async () => {
    try {
      const [catalogs, products, services, masters, orders, users] = await Promise.all([
        axios.get(`${API_URL}/api/catalogs`),
        axios.get(`${API_URL}/api/products`),
        axios.get(`${API_URL}/api/services`),
        axios.get(`${API_URL}/api/masters`),
        axios.get(`${API_URL}/api/admin/orders`),
        axios.get(`${API_URL}/api/users`),
      ]);

      setStats({
        catalogs: catalogs.data.length,
        products: products.data.length,
        services: services.data.length,
        masters: masters.data.length,
        orders: orders.data.length,
        users: users.data.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Вихід',
      'Ви впевнені, що хочете вийти?',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('admin_mode');
            router.replace('/');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Каталоги',
      icon: 'folder-open',
      count: stats.catalogs,
      route: '/admin/catalogs',
      color: COLORS.accent,
    },
    {
      title: 'Товари',
      icon: 'cube',
      count: stats.products,
      route: '/admin/products',
      color: '#4ECDC4',
    },
    {
      title: 'Послуги',
      icon: 'briefcase',
      count: stats.services,
      route: '/admin/services',
      color: '#FFE66D',
    },
    {
      title: 'Майстри',
      icon: 'people',
      count: stats.masters,
      route: '/admin/masters',
      color: '#FF6B6B',
    },
    {
      title: 'Замовлення',
      icon: 'cart',
      count: stats.orders,
      route: '/admin/orders',
      color: '#A8E6CF',
    },
    {
      title: 'Лояльність',
      icon: 'gift',
      count: null,
      route: '/admin/loyalty',
      color: '#DDA0DD',
    },
    {
      title: 'Налаштування',
      icon: 'settings',
      count: null,
      route: '/admin/settings',
      color: '#B8B8B8',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Панель управління</Text>
          <Text style={styles.headerSubtitle}>Shooting Range Admin</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={COLORS.accent} />
            <Text style={styles.statNumber}>{stats.users}</Text>
            <Text style={styles.statLabel}>Користувачів</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cart" size={24} color={COLORS.accent} />
            <Text style={styles.statNumber}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Замовлень</Text>
          </View>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.count !== null && (
                <Text style={styles.menuCount}>{item.count}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.light,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.light,
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  menuCount: {
    fontSize: 12,
    color: COLORS.light,
    marginTop: 4,
  },
});
