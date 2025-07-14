import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { getUserProfile } from "../../firebase/firestore/users";
import { router } from "expo-router";
import { Audio } from "expo-av";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import client from "../../firebase/storage/contentfulClient";

const { width } = Dimensions.get("window");

// Define Exercise Type
type Exercise = {
  id: string;
  type: string;
  lesson: string;
  prompt: string;
  correct_answer: string;
  options?: string[];
  media?: string;
};

export default function Quiz() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    username: string;
    photoURL?: string;
    streakCount?: number;
  } | null>(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResults, setQuizResults] = useState({
    totalQuestions: 0,
    correct: 0,
    score: 0,
    listeningScore: 0,
    writingScore: 0,
    speakingScore: 0,
  });
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Fetch exercises from Contentful
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        // Fetch 5 questions each for Writing, Speaking, and Listening
        const [writingResponse, speakingResponse, listeningResponse] = await Promise.all([
          client.getEntries({
            content_type: "kiswahiliExerciseCollection",
            "fields.typeOfExercise": "Writing",
            limit: 5,
          }),
          client.getEntries({
            content_type: "kiswahiliExerciseCollection",
            "fields.typeOfExercise": "Speaking",
            limit: 5,
          }),
          client.getEntries({
            content_type: "kiswahiliExerciseCollection",
            "fields.typeOfExercise": "Listening",
            limit: 5,
          }),
        ]);

        // Combine all exercises
        const fetchedExercises: Exercise[] = [
          ...writingResponse.items,
          ...speakingResponse.items,
          ...listeningResponse.items,
        ].map((item: any) => ({
          id: item.sys.id,
          type: String(item.fields.typeOfExercise || "Unknown"),
          lesson: String(item.fields.lessonTitle || "Unknown Lesson"),
          prompt: String(item.fields.questionprompt || "No prompt available"),
          correct_answer: String(item.fields.correctAnswer || ""),
          options: Array.isArray(item.fields.multipleChoice)
            ? item.fields.multipleChoice.map(String)
            : [],
          media: item.fields.videosimagesaudio
            ? `https:${item.fields.videosimagesaudio[0].fields.file.url}`
            : undefined,
        }));

        // Shuffle the exercises
        const shuffledExercises = fetchedExercises.sort(() => Math.random() - 0.5);
        setExercises(shuffledExercises);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || quizFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 0) {
          clearInterval(timer);
          setQuizFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizFinished]);

  // Get current exercise
  const currentExercise = quizStarted && exercises.length > currentQuestionIndex 
    ? exercises[currentQuestionIndex] 
    : null;

  // Fetch User Profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Reset audio when moving to a new question
  useEffect(() => {
    const resetAudio = async () => {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
      
      setPlaybackPosition(0);
      setPlaybackDuration(0);
      setRecordedUri(null);
    };
    
    resetAudio();
  }, [currentQuestionIndex]);

  // Cleanup Audio
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording) {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format time helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMilliseconds = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    return formatTime(totalSeconds);
  };

  // Status update function for audio
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    setPlaybackPosition(status.positionMillis);
    setPlaybackDuration(status.durationMillis || 0);
    
    // When audio finishes playing, reset isPlaying state
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };

  // Play/Pause Audio Function
  const toggleAudio = async () => {
    if (!currentExercise || !currentExercise.media) return;

    try {
      if (sound) {
        // If sound exists, toggle play/pause
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        // If no sound object exists yet, create and play it
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentExercise.media },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error handling audio:", error);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert("You need to grant audio permissions.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop Recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  // Play Recorded Audio
  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
    }
  };

  // Handle option selection for Writing and Listening questions
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);

    // Check if the answer is correct
    const isCorrect = option === currentExercise?.correct_answer;
    
    // Update feedback and score
    if (isCorrect) {
      setFeedback("Correct! ✅");
      setScore((prevScore) => prevScore + 10);
      
      // Update type-specific score
      setQuizResults(prev => ({
        ...prev,
        correct: prev.correct + 1,
        score: prev.score + 10,
        ...(currentExercise?.type === "Listening" 
          ? { listeningScore: prev.listeningScore + 10 } 
          : currentExercise?.type === "Writing" 
          ? { writingScore: prev.writingScore + 10 } 
          : {})
      }));
    } else {
      setFeedback("Incorrect ❌");
    }

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  // Check speaking answer
  const checkSpeakingAnswer = () => {
    if (!recordedUri || !currentExercise) return;

    // Simplified: Assume recording is correct
    // In a real app, you would send the audio to a speech recognition service
    const isCorrect = true;
    
    if (isCorrect) {
      setFeedback("Correct! ✅");
      setScore((prevScore) => prevScore + 10);
      
      setQuizResults(prev => ({
        ...prev,
        correct: prev.correct + 1,
        score: prev.score + 10,
        speakingScore: prev.speakingScore + 10
      }));
    } else {
      setFeedback("Incorrect ❌");
    }

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  // Move to next question or finish quiz
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < exercises.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      // Quiz is finished
      setQuizFinished(true);
    }
  };

  // Start the quiz
  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizResults({
      totalQuestions: exercises.length,
      correct: 0,
      score: 0,
      listeningScore: 0,
      writingScore: 0,
      speakingScore: 0,
    });
  };

  // Restart the quiz
  const handleRestartQuiz = () => {
    setQuizStarted(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback(null);
    setQuizResults({
      totalQuestions: exercises.length,
      correct: 0,
      score: 0,
      listeningScore: 0,
      writingScore: 0,
      speakingScore: 0,
    });
  };

  // Return to practice screen
  const handleReturnToPractice = () => {
    router.push("/practice");
  };

  // Render different question types
  const renderQuestionContent = () => {
    if (!currentExercise) return null;

    switch (currentExercise.type) {
      case "Listening":
        return renderListeningQuestion();
      case "Writing":
        return renderWritingQuestion();
      case "Speaking":
        return renderSpeakingQuestion();
      default:
        return null;
    }
  };

  // Render Listening type question
  const renderListeningQuestion = () => {
    return (
      <>
        {/* Audio Player Button */}
        <TouchableOpacity style={styles.audioButton} onPress={toggleAudio}>
          {isPlaying ? (
            <Ionicons name="pause" size={28} color="white" />
          ) : (
            <Ionicons name="play" size={28} color="white" />
          )}
          <Text style={styles.audioText}>
            {isPlaying ? "Pause Audio" : "Play Audio"}
          </Text>
          <View style={styles.audioIconContainer}>
            <AntDesign name="sound" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Audio progress bar */}
        {playbackDuration > 0 && (
          <View style={styles.audioProgressContainer}>
            <View style={styles.audioProgressBarContainer}>
              <View 
                style={[
                  styles.audioProgressBar,
                  { width: `${(playbackPosition / playbackDuration) * 100}%` }
                ]}
              />
            </View>
            <View style={styles.audioTimestamps}>
              <Text style={styles.timestampText}>
                {formatMilliseconds(playbackPosition)}
              </Text>
              <Text style={styles.timestampText}>
                {formatMilliseconds(playbackDuration)}
              </Text>
            </View>
          </View>
        )}

        {/* Question Prompt */}
        <Text style={styles.prompt}>{currentExercise?.prompt}</Text>

        {/* OPTIONS */}
        <View style={styles.optionsContainer}>
          {currentExercise?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === option ? styles.selectedOption : null,
              ]}
              onPress={() => handleOptionSelect(option)}
              disabled={!!selectedOption} // Disable after selection
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  };

  // Render Writing type question
  const renderWritingQuestion = () => {
    return (
      <>
        {/* Question Prompt */}
        <Text style={styles.prompt}>{currentExercise?.prompt}</Text>

        {/* Media (if available) */}
        {currentExercise?.media && !currentExercise.media.startsWith("local:") && (
          <Image 
            source={{ uri: currentExercise.media }}
            style={styles.media} 
          />
        )}

        {/* OPTIONS */}
        <View style={styles.optionsContainer}>
          {currentExercise?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === option ? styles.selectedOption : null,
              ]}
              onPress={() => handleOptionSelect(option)}
              disabled={!!selectedOption}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  };

  // Render Speaking type question
  const renderSpeakingQuestion = () => {
    return (
      <>
        {/* Question Prompt */}
        <Text style={styles.prompt}>{currentExercise?.prompt}</Text>

        {/* Example Audio (if available) */}
        {currentExercise?.media && (
          <View style={styles.audioSection}>
            <TouchableOpacity 
              style={styles.audioButton} 
              onPress={toggleAudio}
            >
              {isPlaying ? (
                <Ionicons name="pause" size={28} color="white" />
              ) : (
                <Ionicons name="play" size={28} color="white" />
              )}
              <Text style={styles.audioText}>
                {isPlaying ? "Pause Example" : "Play Example"}
              </Text>
            </TouchableOpacity>
            
            {/* Audio progress bar */}
            {playbackDuration > 0 && (
              <View style={styles.audioProgressContainer}>
                <View style={styles.audioProgressBarContainer}>
                  <View 
                    style={[
                      styles.audioProgressBar,
                      { width: `${(playbackPosition / playbackDuration) * 100}%` }
                    ]}
                  />
                </View>
                <View style={styles.audioTimestamps}>
                  <Text style={styles.timestampText}>
                    {formatMilliseconds(playbackPosition)}
                  </Text>
                  <Text style={styles.timestampText}>
                    {formatMilliseconds(playbackDuration)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          <Text style={styles.sectionTitle}>Your Response</Text>
          
          {/* Recording state indicators */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                Recording... {formatTime(recordingDuration)}
              </Text>
            </View>
          )}
          
          {/* Recording controls */}
          <View style={styles.controlsContainer}>
            {!isRecording && !recordedUri && (
              <TouchableOpacity 
                onPress={startRecording} 
                style={styles.controlButton}
              >
                <Ionicons name="mic" size={28} color="white" />
                <Text style={styles.controlText}>Start Recording</Text>
              </TouchableOpacity>
            )}
            
            {isRecording && (
              <TouchableOpacity 
                onPress={stopRecording} 
                style={[styles.controlButton, styles.stopButton]}
              >
                <Ionicons name="stop-circle" size={28} color="white" />
                <Text style={styles.controlText}>Stop Recording</Text>
              </TouchableOpacity>
            )}
            
            {recordedUri && (
              <>
                <TouchableOpacity 
                  onPress={playRecording} 
                  style={styles.controlButton}
                >
                  {sound && isPlaying ? (
                    <Ionicons name="pause" size={28} color="white" />
                  ) : (
                    <Ionicons name="play" size={28} color="white" />
                  )}
                  <Text style={styles.controlText}>
                    {sound && isPlaying ? "Pause" : "Play Recording"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => {
                    setRecordedUri(null);
                    if (sound) {
                      sound.unloadAsync();
                      setSound(null);
                    }
                  }} 
                  style={[styles.controlButton, styles.retryButton]}
                >
                  <AntDesign name="reload1" size={28} color="white" />
                  <Text style={styles.controlText}>Record Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Check answer button for speaking questions */}
        {recordedUri && (
          <TouchableOpacity 
            onPress={checkSpeakingAnswer} 
            style={styles.submitButton}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>Check Answer</Text>
            <AntDesign name="checkcircle" size={22} color="white" style={styles.submitIcon} />
          </TouchableOpacity>
        )}
      </>
    );
  };

  // Render quiz results screen
  const renderQuizResults = () => {
    const percentageScore = (quizResults.score / (quizResults.totalQuestions * 10)) * 100;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitleText}>Quiz Complete!</Text>
        
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsScoreText}>Total Score: {quizResults.score}</Text>
          <Text style={styles.resultsPercentText}>{percentageScore.toFixed(0)}%</Text>
          <Text style={styles.resultsCorrectText}>
            {quizResults.correct} out of {quizResults.totalQuestions} questions correct
          </Text>
        </View>
        
        <View style={styles.categoryScores}>
          <Text style={styles.categoryTitle}>Category Scores:</Text>
          
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Listening:</Text>
            <Text style={styles.categoryValue}>{quizResults.listeningScore}</Text>
          </View>
          
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Writing:</Text>
            <Text style={styles.categoryValue}>{quizResults.writingScore}</Text>
          </View>
          
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Speaking:</Text>
            <Text style={styles.categoryValue}>{quizResults.speakingScore}</Text>
          </View>
        </View>
        
        <View style={styles.resultsActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.restartButton]} 
            onPress={handleRestartQuiz}
          >
            <AntDesign name="reload1" size={20} color="white" />
            <Text style={styles.actionButtonText}>Restart Quiz</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.practiceButton]} 
            onPress={handleReturnToPractice}
          >
            <AntDesign name="arrowleft" size={20} color="white" />
            <Text style={styles.actionButtonText}>Return to Practice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main render method
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello {userProfile?.username || "User"}</Text>
          <Text style={styles.subText}>Challenge Yourself!</Text>

          {/* Streak Count */}
          <View style={styles.streakWrapper}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{userProfile?.streakCount ?? 0}</Text>
          </View>
        </View>

        {/* Profile Picture */}
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require("../../assets/images/profile-placeholder.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* QUIZ CONTENT */}
      <View style={styles.quizContent}>
        {!quizStarted ? (
          // Start Quiz Screen
          <View style={styles.startContainer}>
            <Image 
              source={require("../../assets/images/quiz-intro.jpg")} 
              style={styles.startImage}
              resizeMode="contain"
            />
            
            <Text style={styles.startTitle}>Mixed Exercise Quiz</Text>
            <Text style={styles.startDescription}>
              Test your skills with a mix of listening, writing, and speaking exercises!
            </Text>
            
            <View style={styles.quizInfoContainer}>
              <View style={styles.quizInfoItem}>
                <FontAwesome name="question-circle" size={20} color="#3B82F6" />
                <Text style={styles.quizInfoText}>{exercises.length} Questions</Text>
              </View>
              
              <View style={styles.quizInfoItem}>
                <Ionicons name="time-outline" size={20} color="#3B82F6" />
                <Text style={styles.quizInfoText}>20 Minutes</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={handleStartQuiz}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
              <AntDesign name="arrowright" size={20} color="white" style={styles.startButtonIcon} />
            </TouchableOpacity>
          </View>
        ) : quizFinished ? (
          // Quiz Results Screen
          renderQuizResults()
        ) : (
          // Quiz Questions
          <>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {exercises.length}
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${((currentQuestionIndex + 1) / exercises.length) * 100}%` }
                  ]} 
                />
              </View>
              
              {/* Question Type Badge */}
              <View style={[
                styles.typeBadge, 
                currentExercise?.type === "Listening" ? styles.listeningBadge : 
                currentExercise?.type === "Writing" ? styles.writingBadge : 
                styles.speakingBadge
              ]}>
                <Text style={styles.typeBadgeText}>{currentExercise?.type}</Text>
              </View>
            </View>
            
            {/* Question Content */}
            <View style={styles.questionContainer}>
              {renderQuestionContent()}
              
              {/* Feedback Message */}
              {feedback && (
                <View style={[
                  styles.feedbackContainer,
                  feedback.includes("Correct") ? styles.correctFeedback : styles.incorrectFeedback
                ]}>
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              )}
            </View>
            
            {/* SCORE DISPLAY */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  userInfo: {
    alignItems: "center",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  subText: {
    fontSize: 14,
    color: "#7E7C7C",
  },
  streakWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  fireEmoji: {
    fontSize: 16,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    color: "#FF7700",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  quizContent: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 80,
    position: "relative",
  },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  startImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  startDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  quizInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  quizInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quizInfoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  startButtonIcon: {
    marginLeft: 10,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
    position: "relative",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  typeBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  listeningBadge: {
    backgroundColor: "#EFF6FF",
  },
  writingBadge: {
    backgroundColor: "#F0FDF4",
  },
  speakingBadge: {
    backgroundColor: "#FEF2F2",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  questionContainer: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
  },
  prompt: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginVertical: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    width: "100%",
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
  feedbackContainer: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  correctFeedback: {
    backgroundColor: "#D1FAE5",
  },
  incorrectFeedback: {
    backgroundColor: "#FEE2E2",
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scoreContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 20,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  audioText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  audioIconContainer: {
    marginLeft: 10,
  },
  audioProgressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  audioProgressBarContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  audioProgressBar: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 3,
  },
  audioTimestamps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  timestampText: {
    fontSize: 12,
    color: "#6B7280",
  },
  media: {
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 12,
    marginBottom: 20,
  },
  audioSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  recordingSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 150,
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  retryButton: {
    backgroundColor: "#6B7280",
  },
  controlText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitIcon: {
    marginLeft: 10,
  },
  resultsContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  resultsTitleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  resultsSummary: {
    alignItems: "center",
    marginBottom: 30,
  },
  resultsScoreText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  resultsPercentText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 10,
  },
  resultsCorrectText: {
    fontSize: 16,
    color: "#6B7280",
  },
  categoryScores: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  resultsActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
  },
  restartButton: {
    backgroundColor: "#3B82F6",
  },
  practiceButton: {
    backgroundColor: "#6B7280",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  }
});