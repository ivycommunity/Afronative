import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, SafeAreaView, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { SignUpCredentials } from '../../firebase/auth/types';

const { width } = Dimensions.get('window');

export default function SignUp() {
  const { signUp, signInWithGoogle, signInWithApple, loading, error } = useAuth();
  const [credentials, setCredentials] = useState<SignUpCredentials>({
    username: '',
    email: '',
    password: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignUp = async () => {
    if (!acceptedTerms) {
      // You might want to show this in a more user-friendly way
      alert('Please accept the privacy policy to continue');
      return;
    }
    await signUp(credentials);
    router.push('/auth/WelcomeScreen'); // Redirect on successful sign-up
  };
  

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.container,
            { opacity: fadeAnim }
          ]}
        >
          {/* Auth Type Selection */}
          <View style={styles.authTypeContainer}>
            <TouchableOpacity 
              style={styles.inactiveAuthButton}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={styles.inactiveAuthButtonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.activeAuthButton}>
              <Text style={styles.activeAuthButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter Your Username"
                placeholderTextColor="#7E7C7C"
                value={credentials.username}
                onChangeText={(text) => setCredentials(prev => ({ ...prev, username: text }))}
              />
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter Your Email"
                placeholderTextColor="#7E7C7C"
                value={credentials.email}
                onChangeText={(text) => setCredentials(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter Your Password"
                placeholderTextColor="#7E7C7C"
                value={credentials.password}
                onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
                secureTextEntry
              />
            </View>

            {/* Privacy Policy Checkbox */}
            <View style={styles.policyContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, acceptedTerms && styles.checkedBox]}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              />
              <Text style={styles.policyText}>
                I have read and agreed to the privacy policy
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.signUpButton, loading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginPrompt}>
              <Text style={styles.promptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OR Divider */}
          <View style={styles.orContainer}>
            <Text style={styles.orText}>OR</Text>
          </View>

          {/* Social Sign Up Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={signInWithGoogle}
              disabled={loading}
            >
              <Image source={require('../../assets/google.png')} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={signInWithApple}
              disabled={loading}
            >
              <Image source={require('../../assets/apple.png')} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Apple</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: width,
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 30,
  },
  authTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  activeAuthButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: width * 0.4,
    height: 42,
    backgroundColor: '#F9DB82',
    borderRadius: 10,
  },
  inactiveAuthButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: width * 0.4,
    height: 42,
    borderRadius: 10,
  },
  activeAuthButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  inactiveAuthButtonText: {
    color: '#7E7C7C',
    fontSize: 16,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    gap: 25,
  },
  inputGroup: {
    gap: 15,
  },
  label: {
    fontWeight: '700',
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#545454',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  policyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#000000',
  },
  policyText: {
    fontSize: 14,
    color: '#000000',
  },
  signUpButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#F9DB82',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#000000',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptText: {
    fontSize: 14,
    color: '#000000',
  },
  loginLink: {
    fontWeight: '500',
    fontSize: 14,
    color: '#FEF616',
  },
  orContainer: {
    width: 41,
    height: 41,
    backgroundColor: '#FFFFFF',
    borderRadius: 121,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  orText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#000000',
  },
  socialContainer: {
    width: '100%',
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#545454',
    borderRadius: 10,
  },
  socialButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#7E7C7C',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});