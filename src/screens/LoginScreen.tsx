import { createElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { ButtonGoogleCTA, ButtonPrimary, SurfaceCard } from '@/atoms';
import {
  AlertBanner,
  DividerOr,
  FormFieldGroup,
  SegmentedToggle,
} from '@/molecules';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

type AuthMode = 'signIn' | 'signUp';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 8;
// At least one letter and one digit — blocks all-numeric ("11111111") and
// all-letter passwords. Sign-in is exempt so existing passwords keep working.
const PASSWORD_LETTER_PATTERN = /\p{L}/u;
const PASSWORD_DIGIT_PATTERN = /\d/;

const RINGS_SIZE = 340;
const MARK_BADGE_SIZE = 56;

// Flat-stroke concentric rings behind the brand mark. Flat alpha colors on
// purpose — low-opacity gradients band visibly on dark OLED backgrounds.
function RippleRings({ color }: { color: string }) {
  const center = RINGS_SIZE / 2;
  return (
    <Svg
      width={RINGS_SIZE}
      height={RINGS_SIZE}
      style={styles.rings}
      pointerEvents="none"
    >
      <Circle
        cx={center}
        cy={center}
        r={62}
        stroke={withAlpha(color, '2E')}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={104}
        stroke={withAlpha(color, '1F')}
        strokeWidth={1}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={148}
        stroke={withAlpha(color, '12')}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

export function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [infoMessage, setInfoMessage] = useState<string | undefined>();
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  function changeAuthMode(next: string) {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(undefined);
    setInfoMessage(undefined);
    setAuthMode(next as AuthMode);
  }

  async function handleGoogleSignIn() {
    setFormError(undefined);
    setSubmittingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmittingGoogle(false);
    }
  }

  async function handleEmailSubmit() {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(undefined);
    setInfoMessage(undefined);

    let valid = true;
    if (!email.trim()) {
      setEmailError(t('validation.emailRequired'));
      valid = false;
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError(t('validation.emailInvalid'));
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError(t('validation.passwordRequired'));
      valid = false;
    } else if (authMode === 'signUp') {
      if (password.length < PASSWORD_MIN_LENGTH) {
        setPasswordError(
          t('validation.passwordMinLength', { min: PASSWORD_MIN_LENGTH }),
        );
        valid = false;
      } else if (
        !PASSWORD_LETTER_PATTERN.test(password) ||
        !PASSWORD_DIGIT_PATTERN.test(password)
      ) {
        setPasswordError(t('validation.passwordComplexity'));
        valid = false;
      }
    }
    if (!valid) return;

    setSubmittingEmail(true);
    try {
      if (authMode === 'signIn') {
        await signInWithEmail(email.trim(), password);
      } else {
        const data = await signUpWithEmail(email.trim(), password);
        // No session means Supabase requires email confirmation first.
        if (!data.session) {
          setInfoMessage(t('auth.confirmEmailSent', { email: email.trim() }));
          setAuthMode('signIn');
        }
      }
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSubmittingEmail(false);
    }
  }

  const primaryLabel = submittingEmail
    ? authMode === 'signIn'
      ? t('auth.signingIn')
      : t('auth.creatingAccount')
    : authMode === 'signIn'
      ? t('auth.signIn')
      : t('auth.createAccount');

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { gap: theme.spacing.sm }]}>
            <RippleRings color={theme.colors.accentTeal} />
            <View
              style={[
                styles.markBadge,
                {
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.accentTealDim,
                  borderColor: withAlpha(theme.colors.accentTeal, '33'),
                },
              ]}
            >
              {createElement(getIcon('waves'), {
                size: 26,
                color: theme.colors.accentTeal,
              })}
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.heading.bold,
                fontSize: 26,
                color: theme.colors.textPrimary,
              }}
            >
              FollowFlow
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 15,
                lineHeight: 22,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {t('auth.tagline')}
            </Text>
          </View>

          <SurfaceCard style={{ marginTop: theme.spacing.xl }}>
            <SegmentedToggle
              options={[
                { label: t('auth.signIn'), value: 'signIn' },
                { label: t('auth.signUp'), value: 'signUp' },
              ]}
              value={authMode}
              onChange={changeAuthMode}
            />

            {infoMessage ? (
              <AlertBanner
                variant="info"
                icon="mail-check"
                message={infoMessage}
              />
            ) : null}

            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label={t('auth.emailLabel')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
            />
            <FormFieldGroup
              label={t('auth.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              icon="lock"
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              rightIconAccessibilityLabel={
                showPassword ? t('auth.hidePassword') : t('auth.showPassword')
              }
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              error={passwordError}
            />
            <ButtonPrimary
              label={primaryLabel}
              onPress={handleEmailSubmit}
              disabled={submittingEmail}
            />
          </SurfaceCard>

          <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
            <DividerOr />
            <ButtonGoogleCTA
              onPress={handleGoogleSignIn}
              label={
                submittingGoogle
                  ? t('auth.connecting')
                  : t('auth.googleContinue')
              }
              disabled={submittingGoogle}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  rings: {
    position: 'absolute',
    top: MARK_BADGE_SIZE / 2 - RINGS_SIZE / 2,
    left: '50%',
    marginLeft: -RINGS_SIZE / 2,
  },
  header: { alignItems: 'center' },
  markBadge: {
    width: MARK_BADGE_SIZE,
    height: MARK_BADGE_SIZE,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
