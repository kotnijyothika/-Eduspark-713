import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '../../utils/youtube';
import {
  Sparkles,
  BookOpen,
  FileText,
  Zap,
  Play,
  CheckCircle,
  X,
  Flame,
  Star,
  Camera,
  Send,
  Upload,
  Clock,
  ChevronRight,
  Bookmark,
  RefreshCw,
  Mic,
  Volume2,
  HelpCircle,
  RotateCcw,
  Check,
  Layers,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: {
    understandTheQuestion?: string;
    steps?: string[];
    finalAnswer?: string;
    quickTip?: string;
    explanation?: string;
  };
}

// Verified educational lessons fallback
const DEFAULT_EDUCATIONAL_LESSONS = [
  {
    _id: 'lesson-001',
    id: 'lesson-001',
    title: 'Understanding Equivalent Fractions & Parts',
    description: 'Learn how to visualize and calculate fractions with clear visual pie models.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Mathematics',
    chapter: 'Chapter 1: Fractions & Decimals',
    topic: 'Fractions Are Parts',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=CA9XLJpQp3c',
    youtubeVideoId: 'CA9XLJpQp3c',
    thumbnail: 'https://img.youtube.com/vi/CA9XLJpQp3c/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
  },
  {
    _id: 'lesson-002',
    id: 'lesson-002',
    title: 'Photosynthesis & Plant Life Cycle',
    description: 'Weekly concept covering how green plants produce oxygen and food from sunlight.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Science',
    chapter: 'Chapter 1: Plants and Their Parts',
    topic: 'Photosynthesis and Chlorophyll',
    category: 'weekly',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=EstPeBt9CyU',
    youtubeVideoId: 'EstPeBt9CyU',
    thumbnail: 'https://img.youtube.com/vi/EstPeBt9CyU/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
  },
  {
    _id: 'lesson-003',
    id: 'lesson-003',
    title: 'Exploring the Solar System & Planets',
    description: 'Discover the sun, planets, and orbits in our solar system with fun animations.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Science',
    chapter: 'Chapter 2: Earth & Space',
    topic: 'Solar System & Orbits',
    category: 'daily',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=libKVRa01L8',
    youtubeVideoId: 'libKVRa01L8',
    thumbnail: 'https://img.youtube.com/vi/libKVRa01L8/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
  },
  {
    _id: 'lesson-004',
    id: 'lesson-004',
    title: 'How Plants Make Food & Energy',
    description: 'Explore plant biology and how roots, stems, and leaves work together.',
    grade: 'Grade 4',
    className: 'Grade 4 - Alpha',
    classId: 'class-001',
    subject: 'Science',
    chapter: 'Chapter 1: Plants and Their Parts',
    topic: 'Plant Nutrition',
    category: 'weekly',
    contentType: 'video',
    youtubeUrl: 'https://www.youtube.com/watch?v=D1Ymc311XS8',
    youtubeVideoId: 'D1Ymc311XS8',
    thumbnail: 'https://img.youtube.com/vi/D1Ymc311XS8/hqdefault.jpg',
    teacherName: 'Prof. John Keating',
  },
];

export const StudentDashboard: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current section from URL: /student/lessons -> 'lessons'
  const currentSection = location.pathname.replace('/student', '').replace('/', '') || 'home';

  // State Data
  const [profile, setProfile] = useState<any>({ streak: 5, stars: 320, coins: 250, grade: 'Grade 4' });
  const [lessons, setLessons] = useState<any[]>(DEFAULT_EDUCATIONAL_LESSONS);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([
    { id: 'ach-1', title: '5-Day Streak Master', description: 'Logged in and completed learning 5 days in a row!', icon: '🔥', starsReward: 50, coinsReward: 100, unlocked: true },
    { id: 'ach-2', title: 'Fraction Explorer', description: 'Scored over 90% on Fractions & Decimals Quiz', icon: '⭐', starsReward: 30, coinsReward: 60, unlocked: true },
    { id: 'ach-3', title: 'Bookworm Junior', description: 'Bookmarked and completed 5 core subject lessons', icon: '📚', starsReward: 20, coinsReward: 40, unlocked: true },
    { id: 'ach-4', title: 'AI Curiosity Star', description: 'Asked 3 guided questions to the AI Tutor', icon: '🤖', starsReward: 25, coinsReward: 50, unlocked: false },
  ]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Video error & thumbnail error tracking
  const [brokenThumbnails, setBrokenThumbnails] = useState<Record<string, boolean>>({});
  const [videoPlayerError, setVideoPlayerError] = useState<boolean>(false);

  // Toast Notification
  const [notification, setNotification] = useState<string>('');

  // Watch Video Modal
  const [activeVideo, setActiveVideo] = useState<{
    isOpen: boolean;
    videoId: string;
    title: string;
    subject: string;
    chapter?: string;
    topic?: string;
  } | null>(null);

  // AI Homework Helper Modal & Conversational State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi there! I am your EduSpark AI Homework Tutor. Ask me any math or science question (like "Find 25% of 80"), or upload a photo of your notebook page!',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // OCR Upload State
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);

  // Homework Submission Modal
  const [selectedHw, setSelectedHw] = useState<any | null>(null);
  const [homeworkTextAnswer, setHomeworkTextAnswer] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);

  // Quiz Taking Modal
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  // Voice Tutor State
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiThinking]);

  // Load Dashboard Data once authentication is ready
  useEffect(() => {
    if (!authLoading && (token || localStorage.getItem('eduspark_token'))) {
      loadDashboardData();
    }
  }, [authLoading, token]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi<any>('/student/dashboard');
      if (res.success) {
        setProfile(res.profile || { streak: 5, stars: 320, coins: 250, grade: 'Grade 4' });
        const rawLessons = (res.lessons && res.lessons.length > 0) ? res.lessons : DEFAULT_EDUCATIONAL_LESSONS;
        const sanitizedLessons = rawLessons.map((l: any) => {
          if (l.youtubeVideoId === 'n0FQSx012N8' || (l.youtubeUrl && l.youtubeUrl.includes('n0FQSx012N8'))) {
            return {
              ...l,
              youtubeVideoId: 'CA9XLJpQp3c',
              youtubeUrl: 'https://www.youtube.com/watch?v=CA9XLJpQp3c',
              thumbnail: 'https://img.youtube.com/vi/CA9XLJpQp3c/hqdefault.jpg',
            };
          }
          return l;
        });
        setLessons(sanitizedLessons);
        setHomeworks(res.homeworks || []);
        setQuizzes(res.quizzes || []);
        if (res.achievements && res.achievements.length) {
          setAchievements(res.achievements);
        }
        setBookmarks(res.bookmarks || []);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string, _type?: 'success' | 'error' | 'info') => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleToggleBookmark = async (lessonId: string) => {
    try {
      const res = await fetchApi<any>(`/student/bookmark/${lessonId}`, {
        method: 'POST',
      });
      if (res.success) {
        if (bookmarks.includes(lessonId)) {
          setBookmarks((prev) => prev.filter((id) => id !== lessonId));
        } else {
          setBookmarks((prev) => [...prev, lessonId]);
        }
        showToast(res.message || 'Bookmark updated!');
      }
    } catch {
      showToast('Failed to update bookmark.');
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.title || '').toLowerCase().includes(q) ||
      (l.subject || l.category || '').toLowerCase().includes(q) ||
      (l.chapter || '').toLowerCase().includes(q) ||
      (l.topic || '').toLowerCase().includes(q)
    );
  });

  // Watch Video Click
  const handleWatchVideo = (lesson: any) => {
    let videoId = lesson.youtubeVideoId || extractYouTubeVideoId(lesson.youtubeUrl);
    if (videoId === 'n0FQSx012N8') {
      videoId = 'CA9XLJpQp3c';
    }
    if (!videoId) {
      showToast('This lesson does not have a valid video link.');
      return;
    }
    setVideoPlayerError(false);
    setActiveVideo({
      isOpen: true,
      videoId,
      title: lesson.title,
      subject: lesson.subject || lesson.category || 'Lesson',
      chapter: lesson.chapter,
      topic: lesson.topic,
    });
  };

  // Ask AI Homework Helper with Context
  const handleSendAiMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || aiInput).trim();
    if (!promptToSend) {
      showToast('Please enter a question for the AI Homework Helper.');
      return;
    }
    if (isAiThinking) return;

    // Detect subject from context (selected homework, active video lesson, or question content)
    let currentSubject = selectedHw?.subject || activeVideo?.subject || 'Mathematics';
    const qLower = promptToSend.toLowerCase();
    if (
      qLower.includes('plant') ||
      qLower.includes('photosynthesis') ||
      qLower.includes('cell') ||
      qLower.includes('energy') ||
      qLower.includes('gravity') ||
      qLower.includes('magnet') ||
      qLower.includes('water cycle') ||
      qLower.includes('solar') ||
      qLower.includes('ecosystem')
    ) {
      currentSubject = 'Science';
    } else if (
      qLower.includes('noun') ||
      qLower.includes('verb') ||
      qLower.includes('grammar') ||
      qLower.includes('sentence') ||
      qLower.includes('simile') ||
      qLower.includes('poem') ||
      qLower.includes('antonym') ||
      qLower.includes('synonym')
    ) {
      currentSubject = 'English';
    }

    const userMsgId = Date.now().toString();
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { id: userMsgId, role: 'user', text: promptToSend },
    ];
    setChatMessages(newMessages);
    if (!customPrompt) setAiInput('');
    setIsAiThinking(true);

    try {
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          text: m.text,
        }));

      const res = await fetchApi<any>('/ai/homework', {
        method: 'POST',
        body: JSON.stringify({
          question: promptToSend,
          class: profile.grade || user?.grade || 'Grade 4',
          subject: currentSubject,
          history: historyPayload,
        }),
      });

      if (res.success && res.data) {
        const responseData = res.data;
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: responseData.finalAnswer || responseData.explanation || 'Here is the step-by-step solution:',
          data: {
            understandTheQuestion: responseData.understandTheQuestion,
            steps: responseData.steps || responseData.stepByStepSolution,
            finalAnswer: responseData.finalAnswer,
            quickTip: responseData.quickTip,
            explanation: responseData.explanation,
          },
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.message || 'Failed to get answer from AI Helper');
      }
    } catch (err: any) {
      console.error('AI Helper Error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: err.message || 'Sorry, I ran into an issue solving this question. Please try again.',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // OCR File Pick
  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOcrFile(file);
      setOcrPreviewUrl(URL.createObjectURL(file));
    }
  };

  // OCR Upload & Process
  const handleProcessOcr = async () => {
    if (!ocrFile) {
      showToast('Please select an image of your homework first.');
      return;
    }

    setIsScanningOcr(true);
    try {
      const formData = new FormData();
      formData.append('image', ocrFile);
      formData.append('class', profile.grade || 'Grade 4');
      formData.append('subject', 'Mathematics');

      const res = await fetchApi<any>('/ai/ocr-scan', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data) {
        const solution = res.data;
        const extractedQuestion = res.extractedText || solution.question || 'Uploaded Homework Problem';

        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: `[Scanned Notebook]: ${extractedQuestion}`,
        };
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: solution.finalAnswer || 'Here is the step-by-step solution for your notebook problem:',
          data: {
            understandTheQuestion: solution.understandTheQuestion,
            steps: solution.steps || solution.stepByStepSolution,
            finalAnswer: solution.finalAnswer,
            quickTip: solution.quickTip,
            explanation: solution.explanation,
          },
        };

        setChatMessages((prev) => [...prev, userMsg, aiMsg]);
        setOcrFile(null);
        setOcrPreviewUrl(null);
        showToast('Notebook scanned successfully! Solution generated below.');
      } else {
        throw new Error(res.message || 'OCR processing failed.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing homework image.');
    } finally {
      setIsScanningOcr(false);
    }
  };

  // Submit Homework Answer
  const handleSubmitHomework = async (hwId: string) => {
    if (!homeworkTextAnswer.trim()) {
      showToast('Please write your answer before submitting.');
      return;
    }

    setIsSubmittingHw(true);
    try {
      const res = await fetchApi<any>(`/student/homework/${hwId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: homeworkTextAnswer }),
      });

      if (res.success) {
        showToast('Homework submitted successfully! Great work! 🎉');
        setSelectedHw(null);
        setHomeworkTextAnswer('');
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting homework.');
    } finally {
      setIsSubmittingHw(false);
    }
  };

  // Start Quiz (Securely fetches 4 random questions for teacher banks)
  const handleStartQuiz = async (quiz: any) => {
    setUserQuizAnswers({});
    setQuizResult(null);

    if (quiz.isTeacherBank || quiz.quizType === 'teacher_bank') {
      setIsStartingQuiz(true);
      try {
        const bankId = quiz._id || quiz.id;
        const res = await fetchApi<any>(`/student/quiz/bank/${bankId}/start`);
        if (res.success && res.questions) {
          setActiveQuiz({
            ...quiz,
            bankId: res.bankId,
            quizTitle: res.quizTitle,
            subject: res.subject,
            topic: res.topic,
            grade: res.grade,
            questions: res.questions,
            isTeacherBank: true,
          });
        } else {
          throw new Error(res.message || 'Failed to initialize quiz attempt.');
        }
      } catch (err: any) {
        showToast(err.message || 'Error starting teacher quiz.');
      } finally {
        setIsStartingQuiz(false);
      }
    } else {
      setActiveQuiz(quiz);
    }
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = async (quizId: string) => {
    setIsSubmittingQuiz(true);
    try {
      if (activeQuiz?.isTeacherBank || activeQuiz?.quizType === 'teacher_bank') {
        const bankId = activeQuiz.bankId || activeQuiz._id || activeQuiz.id;
        const selectedQuestionIds = (activeQuiz.questions || []).map((q: any) => (q._id || q.id || '').toString());
        const res = await fetchApi<any>(`/student/quiz/bank/${bankId}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            selectedQuestionIds,
            answers: userQuizAnswers,
          }),
        });

        if (res.success) {
          setQuizResult(res);
          setProfile((prev: any) => ({
            ...prev,
            stars: (prev.stars || 0) + (res.starsEarned || 20),
            coins: (prev.coins || 0) + (res.coinsEarned || 50),
          }));
          showToast('🎉 Quiz evaluated! Check your breakdown below!');
        } else {
          throw new Error(res.message || 'Quiz submission failed.');
        }
      } else {
        const res = await fetchApi<any>(`/student/quiz/${quizId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers: userQuizAnswers }),
        });

        if (res.success) {
          setQuizResult(res);
          setProfile((prev: any) => ({
            ...prev,
            stars: (prev.stars || 0) + (res.starsEarned || 20),
            coins: (prev.coins || 0) + (res.coinsEarned || 50),
          }));
          showToast('Quiz submitted! Check your score! 🌟');
        } else {
          throw new Error(res.message || 'Quiz submission failed.');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Voice Tutor Trigger
  const handleStartVoiceTutor = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const fallbackQuery = 'How do green plants turn sunlight into food?';
      setVoiceQuery(fallbackQuery);
      showToast('Speech recognition not supported in this browser. Asking sample question!', 'success');
      triggerVoiceResponse(fallbackQuery);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningVoice(true);
      recognition.onend = () => setIsListeningVoice(false);

      recognition.onerror = (event: any) => {
        setIsListeningVoice(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access was denied. Please allow microphone permissions in your browser settings.', 'error');
        } else if (event.error === 'no-speech') {
          showToast('No speech was detected. Please try tapping and speaking again.', 'error');
        } else {
          showToast(`Voice recognition error (${event.error || 'unknown'}). Try again.`, 'error');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setVoiceQuery(transcript.trim());
          triggerVoiceResponse(transcript.trim());
        } else {
          showToast('Could not understand speech input. Please try speaking clearly.', 'error');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('SpeechRecognition start error:', err);
      showToast('Could not start microphone. Please check permissions.', 'error');
    }
  };

  const triggerVoiceResponse = async (q: string) => {
    if (!q || !q.trim()) {
      showToast('Please speak or type a valid question.');
      return;
    }

    try {
      const res = await fetchApi<any>('/student/voice-tutor', {
        method: 'POST',
        body: JSON.stringify({
          voiceQuestion: q.trim(),
          grade: profile.grade || user?.grade || 'Grade 4',
        }),
      });

      const spoken = res.spokenResponse || res.data?.spokenResponse || res.spokenText || 'That is a wonderful question!';
      setVoiceResponse(spoken);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(spoken);
        utterance.pitch = 1.15;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error('Voice Tutor API Error:', err);
      showToast(err.message || 'Voice tutor is temporarily unavailable. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" pageTitle="Student Learning Explorer">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 text-xs font-bold">Loading student portal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="student"
      pageTitle="Student Learning Explorer"
      searchTerm={searchQuery}
      onSearchChange={setSearchQuery}
      headerAction={
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-900">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span>{profile.streak || 5} Days</span>
          <span className="text-amber-300">|</span>
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{profile.stars || 320} Pts</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div className="p-3.5 rounded-xl bg-blue-600 text-white font-medium text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-200" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')}>
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>
        )}

        {/* ================= SECTION 1: HOME OVERVIEW ================= */}
        {(currentSection === 'home' || currentSection === '') && (
          <div className="space-y-6">
            {/* Greeting Hero Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-xs border border-amber-200">
                  🚀
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Good morning, {user?.name || 'Leo'}!
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Keep learning, you're doing great! You have {lessons.length} video lessons and {quizzes.length} quizzes ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-bold">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Learning Streak: {profile.streak || 5} Days</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold">
                  <Star className="w-4 h-4 text-blue-600 fill-blue-500" />
                  <span>Points: {profile.stars || 320}</span>
                </div>
              </div>
            </div>

            {/* 4 Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/student/lessons')}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all group flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Continue Learning</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lessons.length} Lessons Available</p>
                </div>
              </button>

              <button
                onClick={() => setIsAiModalOpen(true)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">AI Homework Helper</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step tutoring</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/student/homework')}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all group flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Assigned Homework</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{homeworks.length} Due Soon</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/student/quizzes')}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all group flex flex-col justify-between text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Practice Quizzes</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{quizzes.length} Quizzes Ready</p>
                </div>
              </button>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Today's Lessons Feed */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Today's Assigned Lessons</h2>
                    <p className="text-xs text-slate-500">Curated educational videos for {profile.grade || 'Grade 4'}</p>
                  </div>
                  <button
                    onClick={() => navigate('/student/lessons')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredLessons.slice(0, 4).map((lesson) => {
                    const rawId = lesson.youtubeVideoId || extractYouTubeVideoId(lesson.youtubeUrl);
                    const videoId = rawId === 'n0FQSx012N8' ? 'CA9XLJpQp3c' : rawId;
                    const thumb = rawId === 'n0FQSx012N8'
                      ? 'https://img.youtube.com/vi/CA9XLJpQp3c/hqdefault.jpg'
                      : (lesson.thumbnail || (videoId ? getYouTubeThumbnailUrl(videoId) : null));
                    const isBroken = brokenThumbnails[lesson._id || lesson.id];

                    return (
                      <div
                        key={lesson._id || lesson.id}
                        className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group bg-white"
                      >
                        <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => handleWatchVideo(lesson)}>
                          {thumb && !isBroken ? (
                            <img
                              src={thumb}
                              alt={lesson.title}
                              onError={() => setBrokenThumbnails((prev) => ({ ...prev, [lesson._id || lesson.id]: true }))}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 p-4 text-center">
                              <Play className="w-8 h-8 text-blue-400 mb-1" />
                              <span className="text-[11px] font-bold text-white">{lesson.subject || 'Lesson Video'}</span>
                              <span className="text-[10px] text-slate-400">Click to Play Lesson</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600/90 group-hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all">
                              <Play className="w-5 h-5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md inline-block">
                                {lesson.subject || 'Mathematics'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const id = lesson._id || lesson.id;
                                  if (id) handleToggleBookmark(id);
                                }}
                                title={bookmarks.includes(lesson._id || lesson.id) ? 'Bookmarked' : 'Bookmark lesson'}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${bookmarks.includes(lesson._id || lesson.id)
                                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                                    : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${bookmarks.includes(lesson._id || lesson.id) ? 'fill-amber-500' : ''}`} />
                              </button>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {lesson.title}
                            </h3>
                            {lesson.topic && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Topic: {lesson.topic}</p>}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">{lesson.className || 'Grade 4 - Alpha'}</span>
                            <button
                              onClick={() => handleWatchVideo(lesson)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Watch Video</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Performance & Fast AI Query */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-slate-900 mb-1">Subject Performance</h2>
                  <p className="text-xs text-slate-500 mb-4">Academic progress across enrolled subjects</p>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">Mathematics</span>
                        <span className="text-blue-600">88%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">Science</span>
                        <span className="text-emerald-600">92%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700">English Language Arts</span>
                        <span className="text-amber-600">78%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/70 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Quick Homework Question</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3">
                    Need help with fractions or equations? Ask your AI tutor:
                  </p>
                  <button
                    onClick={() => {
                      setIsAiModalOpen(true);
                      handleSendAiMessage('Find 25% of 80.');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 text-xs text-slate-700 font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    💡 "Find 25% of 80."
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: LESSONS ================= */}
        {currentSection === 'lessons' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Assigned Video Lessons & Study Material</h2>
              <p className="text-xs text-slate-500">Watch lessons curated by your teachers for {profile.grade || 'Grade 4'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.map((lesson) => {
                const rawId = lesson.youtubeVideoId || extractYouTubeVideoId(lesson.youtubeUrl);
                const videoId = rawId === 'n0FQSx012N8' ? 'CA9XLJpQp3c' : rawId;
                const thumb = rawId === 'n0FQSx012N8'
                  ? 'https://img.youtube.com/vi/CA9XLJpQp3c/hqdefault.jpg'
                  : (lesson.thumbnail || (videoId ? getYouTubeThumbnailUrl(videoId) : null));
                const isBroken = brokenThumbnails[lesson._id || lesson.id];

                return (
                  <div
                    key={lesson._id || lesson.id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group bg-white"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => handleWatchVideo(lesson)}>
                      {thumb && !isBroken ? (
                        <img
                          src={thumb}
                          alt={lesson.title}
                          onError={() => setBrokenThumbnails((prev) => ({ ...prev, [lesson._id || lesson.id]: true }))}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 p-4 text-center">
                          <Play className="w-8 h-8 text-blue-400 mb-1" />
                          <span className="text-[11px] font-bold text-white">{lesson.subject || 'Lesson Video'}</span>
                          <span className="text-[10px] text-slate-400">Click to Play Lesson</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md inline-block">
                            {lesson.subject || 'Mathematics'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = lesson._id || lesson.id;
                              if (id) handleToggleBookmark(id);
                            }}
                            title={bookmarks.includes(lesson._id || lesson.id) ? 'Bookmarked' : 'Bookmark lesson'}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${bookmarks.includes(lesson._id || lesson.id)
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarks.includes(lesson._id || lesson.id) ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{lesson.title}</h3>
                        {lesson.chapter && <p className="text-[11px] text-slate-500 mt-0.5">{lesson.chapter}</p>}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">{lesson.className || 'Grade 4'}</span>
                        <button
                          onClick={() => handleWatchVideo(lesson)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Watch Video</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SECTION 3: HOMEWORK ================= */}
        {currentSection === 'homework' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Homework & Submissions</h2>
                <p className="text-xs text-slate-500">Submit homework answers or scan your notebook</p>
              </div>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Notebook (OCR)</span>
              </button>
            </div>

            <div className="space-y-3">
              {homeworks.map((hw) => (
                <div key={hw._id || hw.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">{hw.subject || 'General'}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'Upcoming'}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{hw.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{hw.instructions || hw.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedHw(hw);
                      setHomeworkTextAnswer('');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    Submit Answer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 4: AI TUTOR ================= */}
        {currentSection === 'tutor' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">AI Homework Helper</h2>
              <p className="text-xs text-slate-500">Ask questions and receive child-friendly step-by-step guidance</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <p className="font-bold">Ready to solve homework step-by-step!</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Click the button to open the full interactive tutoring dialog</p>
              </div>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Open AI Helper
              </button>
            </div>
          </div>
        )}

        {/* ================= SECTION 5: VOICE TUTOR ================= */}
        {currentSection === 'voice-tutor' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-center py-10">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Mic className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">AI Voice Tutor</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Speak your question directly into the microphone. Your AI tutor will answer back aloud!
            </p>

            <div className="pt-4">
              <button
                onClick={handleStartVoiceTutor}
                className={`px-6 py-3 rounded-2xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${isListeningVoice ? 'bg-rose-500 animate-pulse' : 'bg-pink-600 hover:bg-pink-700'
                  }`}
              >
                {isListeningVoice ? 'Listening to your voice...' : '🎙️ Tap to Speak Question'}
              </button>
            </div>

            {voiceQuery && (
              <div className="max-w-md mx-auto p-3 bg-slate-50 rounded-xl text-xs text-slate-700 mt-4 text-left">
                <p className="font-bold text-slate-900 mb-1">You asked:</p>
                <p>"{voiceQuery}"</p>
              </div>
            )}

            {voiceResponse && (
              <div className="max-w-md mx-auto p-3 bg-pink-50 border border-pink-100 rounded-xl text-xs text-pink-900 mt-3 text-left">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> AI Tutor Spoke:
                </p>
                <p>{voiceResponse}</p>
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 6: QUIZZES ================= */}
        {currentSection === 'quizzes' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Adaptive Practice Quizzes</h2>
              <p className="text-xs text-slate-500">Test your skills and earn stars & coins</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => {
                const isTeacherCreated = quiz.isTeacherBank || quiz.quizType === 'teacher_bank';
                return (
                  <div
                    key={quiz._id || quiz.id}
                    className={`p-5 rounded-2xl border transition-all bg-white flex flex-col justify-between shadow-xs ${isTeacherCreated
                        ? 'border-indigo-200 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/20 to-white'
                        : 'border-slate-200 hover:border-amber-300'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md ${isTeacherCreated
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {quiz.subject || 'Quiz'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isTeacherCreated
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {isTeacherCreated ? '👩‍🏫 Teacher Question Bank' : '✨ AI Quiz'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{quiz.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{quiz.topic || 'General Topic'}</p>

                      {isTeacherCreated ? (
                        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                          <Layers className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                          <span>Draws <strong>4 random questions</strong> from teacher's 20-question bank</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">{quiz.questions?.length || 4} Questions • Instant evaluation</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      disabled={isStartingQuiz}
                      className={`mt-4 w-full py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${isTeacherCreated
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                    >
                      {isStartingQuiz ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Selecting 4 Random Questions...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start 4-Question Quiz</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SECTION 7: ACHIEVEMENTS ================= */}
        {currentSection === 'achievements' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Achievements & Badges</h2>
              <p className="text-xs text-slate-500">Badges earned through consistent daily study</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                    {ach.icon || '⭐'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{ach.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ach.description}</p>
                    <span className="text-[10px] font-bold text-amber-700 mt-1 inline-block">+{ach.starsReward} Stars</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 8: SETTINGS ================= */}
        {currentSection === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 max-w-lg">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Student Preferences</h2>
              <p className="text-xs text-slate-500">Your profile and learning grade settings</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Name</label>
                <input type="text" readOnly value={user?.name || 'Leo Vance'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Enrolled Grade</label>
                <input type="text" readOnly value={profile.grade || 'Grade 4 - Alpha'} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: WATCH YOUTUBE VIDEO ================= */}
      {activeVideo && activeVideo.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm">YouTube</span>
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-1">{activeVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              {videoPlayerError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-rose-400 mb-1">
                    <X className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Video Unavailable</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    This educational video stream could not be loaded in the embedded player. You can open it directly in YouTube:
                  </p>
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open on YouTube</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <iframe
                  src={`${getYouTubeEmbedUrl(activeVideo.videoId)}?autoplay=1`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setVideoPlayerError(true)}
                ></iframe>
              )}
            </div>

            <div className="p-4 bg-slate-800/80 flex items-center justify-between text-xs text-slate-300 border-t border-slate-700/60">
              <span className="font-bold text-slate-200">{activeVideo.subject} {activeVideo.chapter ? `• ${activeVideo.chapter}` : ''}</span>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-white cursor-pointer transition-colors"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: AI HOMEWORK HELPER & OCR ================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[620px] max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">AI Homework Helper</h3>
                  <p className="text-[11px] text-slate-500">Step-by-step guidance & notebook OCR scanner</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OCR Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">Scan Notebook Page:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-blue-600 font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handleOcrFileSelect} className="hidden" />
                </label>
                {ocrFile && (
                  <button
                    onClick={handleProcessOcr}
                    disabled={isScanningOcr}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {isScanningOcr ? 'Scanning...' : 'Scan & Solve'}
                  </button>
                )}
              </div>
            </div>

            {ocrPreviewUrl && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
                <img src={ocrPreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-amber-300" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-amber-900">{ocrFile?.name}</p>
                  <p className="text-[11px] text-amber-700">Click "Scan & Solve" to extract handwriting!</p>
                </div>
                <button onClick={() => { setOcrFile(null); setOcrPreviewUrl(null); }} className="text-amber-800 font-bold text-xs">
                  Remove
                </button>
              </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                      AI
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs ${msg.role === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-none space-y-3'
                    }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.data && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                        {msg.data.understandTheQuestion && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="font-bold text-slate-700 block mb-0.5">🔍 Understand the Question</span>
                            <span className="text-slate-600">{msg.data.understandTheQuestion}</span>
                          </div>
                        )}

                        {msg.data.steps && msg.data.steps.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-slate-700 block">🔢 Step-by-Step Solution:</span>
                            {msg.data.steps.map((step, idx) => (
                              <div key={idx} className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-700 font-medium">
                                {step}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.data.finalAnswer && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                            ✅ Final Answer: {msg.data.finalAnswer}
                          </div>
                        )}

                        {msg.data.quickTip && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                            💡 {msg.data.quickTip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                      {(user?.name || 'L')[0]}
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                    AI
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none text-xs text-slate-500 font-medium flex items-center gap-2 shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Thinking and preparing step-by-step solution...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question or follow-up (e.g. Why did you divide by 100?)..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isAiThinking}
                  className="flex-1 px-4 py-2 text-xs bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-700"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiThinking}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SUBMIT HOMEWORK ================= */}
      {selectedHw && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md">
                  {selectedHw.subject || 'Homework'}
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{selectedHw.title}</h3>
              </div>
              <button onClick={() => setSelectedHw(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs text-slate-600">
              <p className="font-bold text-slate-800 mb-1">Instructions:</p>
              <p>{selectedHw.instructions || selectedHw.description || 'Complete the assignment and write your answer below.'}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Your Answer / Notes:</label>
              <textarea
                rows={5}
                value={homeworkTextAnswer}
                onChange={(e) => setHomeworkTextAnswer(e.target.value)}
                placeholder="Type your homework solution, explanations, or answers here..."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
              ></textarea>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setSelectedHw(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => handleSubmitHomework(selectedHw._id || selectedHw.id)}
                disabled={isSubmittingHw || !homeworkTextAnswer.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingHw ? 'Submitting...' : 'Submit to Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: TAKE QUIZ & RESULTS ================= */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md">
                    {activeQuiz.subject || 'Quiz'}
                  </span>
                  {activeQuiz.isTeacherBank && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                      👩‍🏫 Teacher Question Bank (4 Random Questions)
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">{activeQuiz.title}</h3>
                <p className="text-xs text-slate-500">{activeQuiz.topic || 'Practice Assessment'}</p>
              </div>
              <button onClick={() => setActiveQuiz(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizResult ? (
              <div className="py-2 space-y-5">
                {/* Result Header Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black shadow-xs">
                    {(quizResult.percentage ?? quizResult.score) >= 75 ? '🎉' : '📚'}
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Quiz Completed!</h3>
                  <p className="text-2xl font-black text-indigo-700">
                    Score: {quizResult.correctCount ?? quizResult.score} / {quizResult.totalQuestions || 4}
                    <span className="text-base text-slate-500 font-bold ml-2">
                      ({quizResult.percentage ?? Math.round(quizResult.score)}%)
                    </span>
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/80 border border-amber-300 rounded-full text-xs font-black text-amber-900 mt-1">
                    <span>⭐ +{quizResult.starsEarned || 20} Stars</span>
                    <span>•</span>
                    <span>🪙 +{quizResult.coinsEarned || 50} Coins</span>
                  </div>
                </div>

                {/* Question-by-Question Review Breakdown */}
                {quizResult.results && quizResult.results.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" /> Question-by-Question Review
                    </h4>
                    {quizResult.results.map((resItem: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${resItem.isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/40 border-rose-200'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 text-xs">
                            Q{idx + 1}: {resItem.question}
                          </p>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${resItem.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {resItem.isCorrect ? (
                              <>
                                <Check className="w-3 h-3" /> Correct
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" /> Incorrect
                              </>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-500 font-semibold block">Your Answer:</span>
                            <span className={resItem.isCorrect ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
                              {resItem.studentAnswer || 'None selected'}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-500 font-semibold block">Correct Answer:</span>
                            <span className="font-bold text-emerald-700">{resItem.correctAnswer}</span>
                          </div>
                        </div>

                        {resItem.explanation && (
                          <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-1.5">
                            <span className="font-bold text-indigo-700 shrink-0">💡 Explanation:</span>
                            <span>{resItem.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  {activeQuiz.isTeacherBank && (
                    <button
                      onClick={() => handleStartQuiz(activeQuiz)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-indigo-200 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try Another 4 Random Questions</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizResult(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Answer all <strong>4 questions</strong> below and submit to evaluate your score instantly!
                  </span>
                </div>

                {(activeQuiz.questions || []).map((q: any, qIdx: number) => {
                  const qId = (q._id || q.id || qIdx).toString();
                  const currentSelection = userQuizAnswers[qId] !== undefined ? userQuizAnswers[qId] : userQuizAnswers[qIdx];
                  return (
                    <div key={qIdx} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-3">
                      <p className="text-xs font-bold text-slate-900">
                        Q{qIdx + 1}. {q.question || q.questionText}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.options || []).map((opt: string, optIdx: number) => {
                          const optionLetters = ['A', 'B', 'C', 'D'];
                          const optLetter = optionLetters[optIdx];
                          const isSelected =
                            currentSelection === opt ||
                            currentSelection === optLetter ||
                            currentSelection === `${optLetter}) ${opt}`;

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${isSelected
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-extrabold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <input
                                type="radio"
                                name={`question-${qIdx}`}
                                checked={isSelected}
                                onChange={() => {
                                  setUserQuizAnswers((prev) => ({
                                    ...prev,
                                    [qId]: opt,
                                    [qIdx]: opt,
                                  }));
                                }}
                                className="w-3.5 h-3.5 text-indigo-600"
                              />
                              <span className="font-bold text-slate-400 mr-0.5">{optLetter}.</span>
                              <span className="flex-1">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {Object.keys(userQuizAnswers).length / 2 >= 4 || Object.keys(userQuizAnswers).length >= 4
                      ? '✅ All 4 questions answered'
                      : `Selected ${Math.min(4, Math.ceil(Object.keys(userQuizAnswers).length / 2))} of 4 questions`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitQuiz(activeQuiz._id || activeQuiz.id)}
                      disabled={isSubmittingQuiz}
                      className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmittingQuiz ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <span>Submit Answers</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
