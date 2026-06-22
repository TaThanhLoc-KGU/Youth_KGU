import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/news/HomeScreen';
import ArticleScreen from '../screens/news/ArticleScreen';
import ActivitiesScreen from '../screens/student/ActivitiesScreen';
import MyActivitiesScreen from '../screens/student/MyActivitiesScreen';
import TrainingPointsScreen from '../screens/student/TrainingPointsScreen';
import QRScanScreen from '../screens/student/QRScanScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function NewsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewsList" component={HomeScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} options={{ headerShown: true, title: '', headerBackTitle: 'Tin tức', tintColor: COLORS.primary }} />
    </Stack.Navigator>
  );
}

function ActivitiesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivitiesList" component={ActivitiesScreen} />
      <Stack.Screen name="MyActivities" component={MyActivitiesScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            News:           focused ? 'newspaper'            : 'newspaper-outline',
            Activities:     focused ? 'calendar'             : 'calendar-outline',
            TrainingPoints: focused ? 'ribbon'               : 'ribbon-outline',
            QRScan:         focused ? 'qr-code'              : 'qr-code-outline',
            Profile:        focused ? 'person-circle'        : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="News"           component={NewsStack}          options={{ title: 'Tin tức' }} />
      <Tab.Screen name="Activities"     component={ActivitiesStack}    options={{ title: 'Hoạt động' }} />
      <Tab.Screen name="TrainingPoints" component={TrainingPointsScreen} options={{ title: 'Điểm RL' }} />
      <Tab.Screen name="QRScan"         component={QRScanScreen}       options={{ title: 'Quét QR' }} />
      <Tab.Screen name="Profile"        component={ProfileScreen}       options={{ title: 'Hồ sơ' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.userToken ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
      )}
    </Stack.Navigator>
  );
}
