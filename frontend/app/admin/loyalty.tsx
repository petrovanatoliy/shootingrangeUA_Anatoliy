import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

interface LoyaltyRule {
  id: string;
  min_total_amount: number;
  bonus_points: number;
  discount_percent: number;
}

export default function LoyaltyScreen() {
  const router = useRouter();
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    min_total_amount: '',
    bonus_points: '',
    discount_percent: '',
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/loyalty-rules`);
      setRules(response.data);
    } catch (error) {
      console.error('Failed to load loyalty rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRules();
    setRefreshing(false);
  };

  const handleAddRule = async () => {
    if (!newRule.min_total_amount) {
      Alert.alert('Помилка', 'Введіть мінімальну суму');
      return;
    }

    try {
      const data = {
        min_total_amount: parseFloat(newRule.min_total_amount),
        bonus_points: parseInt(newRule.bonus_points) || 0,
        discount_percent: parseFloat(newRule.discount_percent) || 0,
      };

      await axios.post(`${API_URL}/api/loyalty-rules`, data);
      setNewRule({ min_total_amount: '', bonus_points: '', discount_percent: '' });
      setShowAddForm(false);
      await loadRules();
      Alert.alert('Успіх', 'Правило додано');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося додати правило');
    }
  };

  const deleteRule = (rule: LoyaltyRule) => {
    Alert.alert(
      'Видалення',
      `Видалити правило для ${rule.min_total_amount} грн?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/loyalty-rules/${rule.id}`);
              setRules((prev) => prev.filter((r) => r.id !== rule.id));
            } catch (error) {
              Alert.alert('Помилка', 'Не вдалося видалити правило');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: LoyaltyRule; index: number }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleLevel}>
        <Text style={styles.ruleLevelText}>Рівень {index + 1}</Text>
      </View>
      <View style={styles.ruleContent}>
        <View style={styles.ruleRow}>
          <Ionicons name="cash-outline" size={20} color={COLORS.accent} />
          <Text style={styles.ruleLabel}>Мін. сума:</Text>
          <Text style={styles.ruleValue}>{item.min_total_amount} грн</Text>
        </View>
        <View style={styles.ruleRow}>
          <Ionicons name="gift-outline" size={20} color={COLORS.success} />
          <Text style={styles.ruleLabel}>Бонуси:</Text>
          <Text style={styles.ruleValue}>+{item.bonus_points}</Text>
        </View>
        <View style={styles.ruleRow}>
          <Ionicons name="pricetag-outline" size={20} color={COLORS.warning} />
          <Text style={styles.ruleLabel}>Скидка:</Text>
          <Text style={styles.ruleValue}>{item.discount_percent}%</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteRule(item)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Система лояльності</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Нове правило</Text>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Мін. сума (грн)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRule.min_total_amount}
                  onChangeText={(text) => setNewRule({ ...newRule, min_total_amount: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.accent}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Бонуси</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRule.bonus_points}
                  onChangeText={(text) => setNewRule({ ...newRule, bonus_points: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.accent}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Скидка (%)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newRule.discount_percent}
                  onChangeText={(text) => setNewRule({ ...newRule, discount_percent: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.accent}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddRule}>
              <Text style={styles.saveButtonText}>Додати правило</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Правила визначають бонуси та скидки в залежності від загальної суми замовлень користувача.
          </Text>
        </View>

        <FlatList
          data={rules}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="gift-outline" size={64} color={COLORS.accent} />
                <Text style={styles.emptyText}>Немає правил лояльності</Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS_EXT = {
  ...COLORS,
  warning: '#FFE66D',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  keyboardView: {
    flex: 1,
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
  addForm: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    color: COLORS.light,
    fontSize: 12,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,121,194,0.2)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: COLORS.light,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  ruleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleLevel: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  ruleLevelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  ruleContent: {
    flex: 1,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleLabel: {
    color: COLORS.light,
    fontSize: 13,
  },
  ruleValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.light,
    marginTop: 16,
  },
});
