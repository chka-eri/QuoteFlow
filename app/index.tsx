import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { Pressable } from 'react-native';

type Category = 'Inspiration' | 'Wisdom' | 'Success' | 'Life' | 'Love';

interface Quote {
  id: string;
  text: string;
  author: string;
  category: Category;
}

const CATEGORIES: Category[] = ['Inspiration', 'Wisdom', 'Success', 'Life', 'Love'];

const QUOTES: Quote[] = [
  { id: 'i1', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'Inspiration' },
  { id: 'i2', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'Inspiration' },
  { id: 'i3', text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'Inspiration' },
  { id: 'i4', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'Inspiration' },
  { id: 'i5', text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair', category: 'Inspiration' },
  { id: 'i6', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'Inspiration' },
  { id: 'w1', text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'Wisdom' },
  { id: 'w2', text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', category: 'Wisdom' },
  { id: 'w3', text: 'The unexamined life is not worth living.', author: 'Socrates', category: 'Wisdom' },
  { id: 'w4', text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle', category: 'Wisdom' },
  { id: 'w5', text: 'The wise man speaks because he has something to say; the fool because he has to say something.', author: 'Plato', category: 'Wisdom' },
  { id: 'w6', text: 'By three methods we may learn wisdom: first, by reflection, which is noblest; second, by imitation, which is easiest; and third by experience, which is the bitterest.', author: 'Confucius', category: 'Wisdom' },
  { id: 's1', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'Success' },
  { id: 's2', text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'Success' },
  { id: 's3', text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau', category: 'Success' },
  { id: 's4', text: 'Don\'t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller', category: 'Success' },
  { id: 's5', text: 'I find that the harder I work, the more luck I seem to have.', author: 'Thomas Jefferson', category: 'Success' },
  { id: 's6', text: 'The secret of success is to do the common thing uncommonly well.', author: 'John D. Rockefeller Jr.', category: 'Success' },
  { id: 'l1', text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon', category: 'Life' },
  { id: 'l2', text: 'Get busy living or get busy dying.', author: 'Stephen King', category: 'Life' },
  { id: 'l3', text: 'In the end, it\'s not the years in your life that count. It\'s the life in your years.', author: 'Abraham Lincoln', category: 'Life' },
  { id: 'l4', text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'Life' },
  { id: 'l5', text: 'Life is really simple, but we insist on making it complicated.', author: 'Confucius', category: 'Life' },
  { id: 'l6', text: 'Count your age by friends, not years. Count your life by smiles, not tears.', author: 'John Lennon', category: 'Life' },
  { id: 'v1', text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn', category: 'Love' },
  { id: 'v2', text: 'Where there is love there is life.', author: 'Mahatma Gandhi', category: 'Love' },
  { id: 'v3', text: 'Love all, trust a few, do wrong to none.', author: 'William Shakespeare', category: 'Love' },
  { id: 'v4', text: 'The greatest thing you\'ll ever learn is just to love and be loved in return.', author: 'Nat King Cole', category: 'Love' },
  { id: 'v5', text: 'Love is composed of a single soul inhabiting two bodies.', author: 'Aristotle', category: 'Love' },
  { id: 'v6', text: 'We are most alive when we\'re in love.', author: 'John Updike', category: 'Love' },
];

function getQuoteOfTheDay(all: Quote[]): Quote {
  const start = new Date(2025, 0, 1).getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return all[((day % all.length) + all.length) % all.length];
}

function PressableScale({ onPress, style, children, ...props }: any) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={(e) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(e); }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function IndexScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('favorites').then((data) => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const quoteOfTheDay = useMemo(() => getQuoteOfTheDay(QUOTES), []);
  const accent = '#7C3AED';
  const muted = isDark ? '#9CA3AF' : '#6B7280';

  const filteredQuotes = useMemo(() => {
    let list = QUOTES;
    if (selectedCategory) list = list.filter((q) => q.category === selectedCategory);
    if (showFavoritesOnly) list = list.filter((q) => favorites.includes(q.id));
    return list;
  }, [selectedCategory, showFavoritesOnly, favorites]);

  const glassCard = {
    backgroundColor: isDark ? 'rgba(28,31,33,0.75)' : 'rgba(248,249,250,0.72)',
    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px) saturate(180%)' as any } : {}),
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#7C3AED15', '#151718'] : ['#7C3AED08', '#fff']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(14)}>
          <Text style={[s.heading, { color: colors.text }]}>QuoteFlow</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify().damping(14)}>
          <LinearGradient
            colors={['#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.qotdCard}
          >
            <Text style={s.qotdLabel}>QUOTE OF THE DAY</Text>
            <Text style={s.qotdText}>{quoteOfTheDay.text}</Text>
            <View style={s.qotdDivider} />
            <Text style={s.qotdAuthor}>{quoteOfTheDay.author}</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify().damping(14)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <PressableScale
                  key={cat}
                  onPress={() => setSelectedCategory(active ? null : cat)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: active ? accent : 'transparent',
                      borderColor: active ? accent : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                    },
                  ]}
                >
                  <Text style={[s.chipLabel, { color: active ? '#FFF' : colors.text }]}>
                    {cat}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify().damping(14)}>
          <PressableScale
            onPress={() => setShowFavoritesOnly((v) => !v)}
            style={[s.favToggle, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' }]}
          >
            <Text style={[s.favToggleIcon, { color: showFavoritesOnly ? '#EF4444' : muted }]}>
              {showFavoritesOnly ? '\u2665' : '\u2661'}
            </Text>
            <Text style={[s.favToggleLabel, { color: colors.text }]}>
              {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
            </Text>
          </PressableScale>
        </Animated.View>

        {filteredQuotes.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={[s.emptyText, { color: muted }]}>No quotes yet</Text>
          </View>
        ) : (
          filteredQuotes.map((q, i) => {
            const isFav = favorites.includes(q.id);
            return (
              <Animated.View
                key={q.id}
                entering={FadeInDown.delay(250 + i * 50).springify().damping(14)}
              >
                <PressableScale
                  onPress={() => toggleFavorite(q.id)}
                  style={[s.quoteCard, glassCard]}
                >
                  <View style={s.quoteRow}>
                    <View style={s.quoteContent}>
                      <Text style={[s.quoteText, { color: colors.text }]}>{'\u201C'}{q.text}{'\u201D'}</Text>
                      <Text style={[s.quoteAuthor, { color: muted }]}>
                        {q.author} · {q.category}
                      </Text>
                    </View>
                    <Text style={[s.heart, { color: isFav ? '#EF4444' : muted }]}>
                      {isFav ? '\u2665' : '\u2661'}
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 20 },
  qotdCard: { borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10 },
  qotdLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  qotdText: { color: '#FFF', fontSize: 20, fontWeight: '600', lineHeight: 28, fontStyle: 'italic' },
  qotdDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  qotdAuthor: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  favToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 16, alignSelf: 'flex-start' },
  favToggleIcon: { fontSize: 18 },
  favToggleLabel: { fontSize: 14, fontWeight: '600' },
  quoteCard: { borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quoteRow: { flexDirection: 'row', alignItems: 'flex-start' },
  quoteContent: { flex: 1, marginRight: 12 },
  quoteText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 13, marginTop: 8 },
  heart: { fontSize: 22, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16 },
});
