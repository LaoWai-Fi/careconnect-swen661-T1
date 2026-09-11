// Landing / marketing screen — RN port of landing_screen.dart.
//
// Teal hero with the logo + wordmark, primary "Get started" CTA, and a
// ghost "I already have an account" button whose white foreground/border
// overrides keep it legible on the teal background.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from '../components/Cards';
import { TapButton } from '../components/TapButton';
import { useAppTheme } from '../hooks/useAppTheme';
import { CCTokens } from '../theme/tokens';

export interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
  const { scheme } = useAppTheme();
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: CCTokens.primaryLight }]}>
          <View style={styles.heroInner}>
            <Logo size={64} />
            <Text style={styles.wordmark}>CareConnect</Text>
            <Text style={styles.tagline}>
              Coordinate care for the people you love — together.
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Feature icon="💊" title="Medications" body="Track doses and get reminders." />
          <Feature icon="📅" title="Appointments" body="Never miss a visit or check-up." />
          <Feature icon="✉️" title="Messages" body="Keep the whole family in the loop." />
          <Feature icon="👤" title="Check-ins" body="Know Margaret is okay each morning." />

          <View style={[styles.assistant, { borderColor: CCTokens.primaryLight }]}>
            <Text style={{ fontSize: 28 }}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.assistantTitle}>Care assistant</Text>
              <Text style={styles.assistantBody}>
                Ask questions like &quot;What does Margaret take in the morning?&quot;
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TapButton label="Get started" size="lg" fullWidth scheme={scheme} onPress={onGetStarted} />
        <TapButton
          label="I already have an account"
          variant="ghost"
          size="lg"
          fullWidth
          scheme={scheme}
          foregroundColor="#FFFFFF"
          borderColor="#FFFFFF"
          onPress={onSignIn}
        />
      </View>
    </View>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.feature}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F7' },
  scroll: { flexGrow: 1 },
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    textAlign: 'center',
  },
  body: { padding: 24, gap: 16 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3DEE5',
    padding: 16,
  },
  featureTitle: { fontWeight: '700', fontSize: 15, color: '#1A2B35' },
  featureBody: { fontSize: 13, color: '#4E6470' },
  assistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  assistantTitle: { fontWeight: '700', fontSize: 15, color: '#1A2B35' },
  assistantBody: { fontSize: 13, color: '#4E6470' },
  footer: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: CCTokens.primaryLight,
  },
});

// Feature/assistant text colors are fixed to the light palette because the
// landing hero is always teal regardless of app theme.
