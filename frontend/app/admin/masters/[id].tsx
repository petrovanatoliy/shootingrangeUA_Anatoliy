import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

const POSITIONS = ['Інструктор', 'Головний інструктор', 'Спеціаліст', 'Майстер', 'Гуру'];

interface Service {
  id: string;
  name: string;
}

export default function MasterEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [showServicesPicker, setShowServicesPicker] = useState(false);

  useEffect(() => {
    loadServices();
    if (!isNew && id) {
      loadMaster();
    }
  }, [id]);

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadMaster = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/masters/${id}`);
      const master = response.data;
      setFullName(master.full_name);
      setPosition(master.position);
      setDescription(master.description || '');
      setIsActive(master.is_active);
      setSelectedServices(master.service_ids || []);
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити майстра');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Помилка', 'Введіть ПІБ майстра');
      return;
    }

    setSaving(true);
    try {
      const data = {
        full_name: fullName.trim(),
        position,
        description: description.trim() || null,
        is_active: isActive,
      };

      let masterId = id;

      if (isNew) {
        const response = await axios.post(`${API_URL}/api/masters`, data);
        masterId = response.data.id;
      } else {
        await axios.put(`${API_URL}/api/masters/${id}`, data);
      }

      // Update service links
      const currentMaster = await axios.get(`${API_URL}/api/masters/${masterId}`);
      const currentServiceIds = currentMaster.data.service_ids || [];

      // Unlink removed services
      for (const serviceId of currentServiceIds) {
        if (!selectedServices.includes(serviceId)) {
          await axios.delete(`${API_URL}/api/masters/${masterId}/services/${serviceId}`);
        }
      }

      // Link new services
      for (const serviceId of selectedServices) {
        if (!currentServiceIds.includes(serviceId)) {
          await axios.post(`${API_URL}/api/masters/${masterId}/services/${serviceId}`);
        }
      }

      Alert.alert('Успіх', isNew ? 'Майстра створено' : 'Майстра оновлено');
      router.back();
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося зберегти майстра');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>
            {isNew ? 'Новий майстер' : 'Редагування'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="checkmark" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={COLORS.white} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ПІБ *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Введіть ПІБ"
              placeholderTextColor={COLORS.accent}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Посада *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPositionPicker(!showPositionPicker)}
            >
              <Text style={styles.pickerText}>{position}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.light} />
            </TouchableOpacity>
            {showPositionPicker && (
              <View style={styles.pickerDropdown}>
                {POSITIONS.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.pickerOption,
                      pos === position && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setPosition(pos);
                      setShowPositionPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Опис</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Досвід, спеціалізація..."
              placeholderTextColor={COLORS.accent}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Послуги</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowServicesPicker(!showServicesPicker)}
            >
              <Text style={styles.pickerText}>
                {selectedServices.length > 0
                  ? `Вибрано: ${selectedServices.length}`
                  : 'Оберіть послуги'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.light} />
            </TouchableOpacity>
            {showServicesPicker && (
              <View style={styles.pickerDropdown}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.pickerOption,
                      selectedServices.includes(service.id) && styles.pickerOptionSelected,
                    ]}
                    onPress={() => toggleService(service.id)}
                  >
                    <Text style={styles.pickerOptionText}>{service.name}</Text>
                    {selectedServices.includes(service.id) && (
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.visibilityToggle}
            onPress={() => setIsActive(!isActive)}
          >
            <View style={styles.visibilityInfo}>
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={isActive ? COLORS.success : COLORS.warm}
              />
              <Text style={styles.visibilityTitle}>
                {isActive ? 'Активний' : 'Неактивний'}
              </Text>
            </View>
            <View
              style={[
                styles.visibilityIndicator,
                isActive ? styles.visibilityOn : styles.visibilityOff,
              ]}
            />
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButton: {
    padding: 8,
    backgroundColor: COLORS.success,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.light,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.white,
  },
  pickerDropdown: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  pickerOptionText: {
    color: COLORS.white,
    fontSize: 16,
  },
  visibilityToggle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visibilityTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  visibilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  visibilityOn: {
    backgroundColor: COLORS.success,
  },
  visibilityOff: {
    backgroundColor: COLORS.warm,
  },
  bottomPadding: {
    height: 40,
  },
});
