import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COLORS = {
  primary: '#202447',
  secondary: '#193B89',
  accent: '#6379C2',
  light: '#CAD2F6',
  warm: '#5A3E40',
  white: '#FFFFFF',
  success: '#4ECDC4',
  danger: '#FF6B6B',
};

interface Catalog {
  id: string;
  name: string;
  image: string | null;
  is_visible: boolean;
  created_at: string;
}

export default function CatalogsScreen() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/catalogs`);
      setCatalogs(response.data);
    } catch (error) {
      console.error('Failed to load catalogs:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити каталоги');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogs();
    setRefreshing(false);
  };

  const toggleVisibility = async (catalog: Catalog) => {
    try {
      await axios.put(`${API_URL}/api/catalogs/${catalog.id}`, {
        is_visible: !catalog.is_visible,
      });
      setCatalogs((prev) =>
        prev.map((c) =>
          c.id === catalog.id ? { ...c, is_visible: !c.is_visible } : c
        )
      );
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося змінити видимість');
    }
  };

  const deleteCatalog = (catalog: Catalog) => {
    Alert.alert(
      'Видалення',
      `Видалити каталог "${catalog.name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/catalogs/${catalog.id}`);
              setCatalogs((prev) => prev.filter((c) => c.id !== catalog.id));
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити каталог');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Catalog }) => (
    <View style={styles.catalogCard}>
      <TouchableOpacity
        style={styles.catalogContent}
        onPress={() => router.push(`/admin/catalogs/${item.id}`)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.catalogImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color={COLORS.accent} />
          </View>
        )}
        <View style={styles.catalogInfo}>
          <Text style={styles.catalogName}>{item.name}</Text>
          <Text style={styles.catalogStatus}>
            {item.is_visible ? 'Видимий' : 'Прихований'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.catalogActions}>
        <Switch
          value={item.is_visible}
          onValueChange={() => toggleVisibility(item)}
          trackColor={{ false: COLORS.warm, true: COLORS.success }}
          thumbColor={COLORS.white}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteCatalog(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Каталоги</Text>
        <TouchableOpacity
          onPress={() => router.push('/admin/catalogs/new')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={catalogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.accent} />
              <Text style={styles.emptyText}>Немає каталогів</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/admin/catalogs/new')}
              >
                <Text style={styles.emptyButtonText}>Додати каталог</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addButton: {
    padding: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  catalogCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  catalogContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogInfo: {
    flex: 1,
    marginLeft: 12,
  },
  catalogName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  catalogStatus: {
    fontSize: 12,
    color: COLORS.light,
    marginTop: 4,
  },
  catalogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.light,
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
