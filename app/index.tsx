import { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const imageTranslateY = useSharedValue(height);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);

  useEffect(() => {
    // Start animations when component mounts
    imageTranslateY.value = withSpring(0, {
      damping: 15,
      stiffness: 50,
    });

    textOpacity.value = withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    textScale.value = withSpring(1, {
      damping: 15,
      stiffness: 50,
    });

    // Navigate to sign-in page after 3.5 seconds
    const timer = setTimeout(() => {
      // Fade out animations
      textOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      imageTranslateY.value = withSpring(height, {
        damping: 15,
        stiffness: 50,
      });

      // Navigate after fade out
      setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 500);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: imageTranslateY.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  return (
    <LinearGradient
      colors={['#FEF616', '#FCA502']}
      style={styles.container}
    >
      <Animated.Text style={[styles.title, textAnimatedStyle]}>
        NATIVELAB
      </Animated.Text>
      <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
        <Image
          source={require('../assets/images/intro_img.png')}
          style={styles.image}
          contentFit="contain"
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: width,
    height: height,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF616',
  },
  imageContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 2,
  },
});
