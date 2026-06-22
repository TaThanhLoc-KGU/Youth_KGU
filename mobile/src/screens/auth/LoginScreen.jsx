import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
    } catch (e) {
      setError(e.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1c6681', '#0d3f52']} style={s.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logoWrap}>
            <Image
              source={require('../../../assets/icon.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.appName}>Youth KGU</Text>
            <Text style={s.appSub}>Đoàn Thanh niên – Hội Sinh viên</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Đăng nhập</Text>

            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={s.field}>
              <Text style={s.label}>Tên đăng nhập</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={18} color={COLORS.textLight} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Nhập username hoặc MSSV"
                  placeholderTextColor={COLORS.textLight}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mật khẩu</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8} style={s.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textLight} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [s.loginBtn, pressed && s.btnPressed, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.loginBtnText}>Đăng nhập</Text>
              }
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo:     { width: 72, height: 72, marginBottom: 12 },
  appName:  { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  appSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card:     { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  cardTitle:{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:{ fontSize: 13, color: COLORS.danger, flex: 1 },
  field:    { marginBottom: 16 },
  label:    { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 12 },
  inputIcon:{ marginRight: 8 },
  input:    { flex: 1, height: 44, fontSize: 15, color: COLORS.text },
  eyeBtn:   { padding: 4 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnPressed:   { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnDisabled:  { opacity: 0.7 },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
