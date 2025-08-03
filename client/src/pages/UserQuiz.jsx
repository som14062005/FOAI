import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Users,
  Utensils,
  Mountain,
  Building,
  Camera,
  Heart,
  Star,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserQuiz.css';

const UserQuizUI = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [processingSteps, setProcessingSteps] = useState([
    { id: 1, text: 'Analyzing your responses', completed: false, active: false },
    { id: 2, text: 'AI processing preferences', completed: false, active: false },
    { id: 3, text: 'Generating personality profile', completed: false, active: false },
    { id: 4, text: 'Personalizing recommendations', completed: false, active: false }
  ]);

  const questions = [
    {
      id: 'food_preference',
      question: 'What type of culinary experience excites you most?',
      type: 'single',
      icon: <Utensils className="question-icon" />,
      options: [
        { 
          value: 'local_street', 
          label: 'Local street food and authentic cuisine', 
          weight: { foodie: 3, culture: 2 },
          emoji: '🍜'
        },
        { 
          value: 'fine_dining', 
          label: 'Fine dining and gourmet restaurants', 
          weight: { foodie: 3, luxury: 2 },
          emoji: '🍷'
        },
        { 
          value: 'familiar', 
          label: 'Familiar food that I know I like', 
          weight: { comfort: 2, family: 1 },
          emoji: '🍔'
        },
        { 
          value: 'healthy', 
          label: 'Fresh, healthy, and organic options', 
          weight: { nature: 2, wellness: 3 },
          emoji: '🥗'
        }
      ]
    },
    {
      id: 'activity_preference',
      question: 'How do you prefer to spend your ideal day while traveling?',
      type: 'single',
      icon: <Mountain className="question-icon" />,
      options: [
        { 
          value: 'outdoor_adventure', 
          label: 'Hiking, nature walks, or outdoor adventures', 
          weight: { nature: 3, adventure: 3 },
          emoji: '🏔️'
        },
        { 
          value: 'cultural_sites', 
          label: 'Visiting museums, monuments, and cultural sites', 
          weight: { culture: 3, heritage: 3 },
          emoji: '🏛️'
        },
        { 
          value: 'relaxation', 
          label: 'Spa, beach, or peaceful relaxation', 
          weight: { wellness: 3, luxury: 2 },
          emoji: '🏖️'
        },
        { 
          value: 'nightlife', 
          label: 'Shopping, nightlife, and entertainment', 
          weight: { social: 3, urban: 2 },
          emoji: '🌃'
        }
      ]
    },
    {
      id: 'accommodation_style',
      question: 'What type of accommodation appeals to you most?',
      type: 'single',
      icon: <Building className="question-icon" />,
      options: [
        { 
          value: 'luxury_hotel', 
          label: 'Luxury hotels with premium amenities', 
          weight: { luxury: 3, comfort: 2 },
          emoji: '🏨'
        },
        { 
          value: 'boutique', 
          label: 'Boutique hotels with unique character', 
          weight: { culture: 2, aesthetic: 3 },
          emoji: '🏘️'
        },
        { 
          value: 'local_stay', 
          label: 'Local homestays or authentic experiences', 
          weight: { culture: 3, authentic: 3 },
          emoji: '🏠'
        },
        { 
          value: 'budget_clean', 
          label: 'Budget-friendly but clean and safe', 
          weight: { budget: 3, practical: 2 },
          emoji: '🛏️'
        }
      ]
    },
    {
      id: 'pace_preference',
      question: 'What pace do you prefer for your travels?',
      type: 'single',
      icon: <Zap className="question-icon" />,
      options: [
        { 
          value: 'slow_deep', 
          label: 'Slow and deep - few places, more time each', 
          weight: { contemplative: 3, cultural: 2 },
          emoji: '🧘'
        },
        { 
          value: 'balanced', 
          label: 'Balanced mix of activities and relaxation', 
          weight: { balanced: 3, family: 2 },
          emoji: '⚖️'
        },
        { 
          value: 'fast_packed', 
          label: 'Fast-paced with many activities', 
          weight: { adventure: 3, energetic: 3 },
          emoji: '⚡'
        },
        { 
          value: 'spontaneous', 
          label: 'Spontaneous without strict planning', 
          weight: { flexible: 3, adventure: 2 },
          emoji: '🎲'
        }
      ]
    },
    {
      id: 'social_preference',
      question: 'How do you prefer to interact during your travels?',
      type: 'single',
      icon: <Users className="question-icon" />,
      options: [
        { 
          value: 'meet_locals', 
          label: 'Meet and interact with local people', 
          weight: { social: 3, cultural: 2 },
          emoji: '🤝'
        },
        { 
          value: 'fellow_travelers', 
          label: 'Connect with other travelers', 
          weight: { social: 2, adventure: 1 },
          emoji: '👥'
        },
        { 
          value: 'small_group', 
          label: 'Stick with my travel companions', 
          weight: { intimate: 2, family: 2 },
          emoji: '👨‍👩‍👧‍👦'
        },
        { 
          value: 'solo_peace', 
          label: 'Enjoy solitude and peaceful moments', 
          weight: { contemplative: 3, wellness: 2 },
          emoji: '🧘‍♀️'
        }
      ]
    },
    {
      id: 'interest_priorities',
      question: 'Which aspects of travel interest you most? (Select up to 3)',
      type: 'multiple',
      maxSelections: 3,
      icon: <Target className="question-icon" />,
      options: [
        { 
          value: 'history', 
          label: 'Historical sites and stories', 
          weight: { heritage: 3, culture: 2 },
          emoji: '🏺'
        },
        { 
          value: 'nature', 
          label: 'Natural beauty and wildlife', 
          weight: { nature: 3, wellness: 1 },
          emoji: '🦋'
        },
        { 
          value: 'photography', 
          label: 'Photography and scenic views', 
          weight: { aesthetic: 3, nature: 1 },
          emoji: '📸'
        },
        { 
          value: 'food_drink', 
          label: 'Food and local beverages', 
          weight: { foodie: 3, culture: 1 },
          emoji: '🍽️'
        },
        { 
          value: 'shopping', 
          label: 'Shopping and local markets', 
          weight: { urban: 2, cultural: 1 },
          emoji: '🛍️'
        },
        { 
          value: 'spirituality', 
          label: 'Spiritual or religious experiences', 
          weight: { spiritual: 3, contemplative: 2 },
          emoji: '🕯️'
        },
        { 
          value: 'adventure_sports', 
          label: 'Adventure sports and activities', 
          weight: { adventure: 3, energetic: 2 },
          emoji: '🏂'
        },
        { 
          value: 'arts_crafts', 
          label: 'Arts, crafts, and local creativity', 
          weight: { cultural: 3, aesthetic: 2 },
          emoji: '🎨'
        }
      ]
    }
  ];

  const userTypes = {
    foodie: {
      name: 'Foodie Explorer',
      description: 'You travel for authentic culinary experiences and local flavors',
      icon: <Utensils className="type-icon" />,
      color: '#f97316',
      traits: ['Culinary Adventures', 'Local Markets', 'Cooking Classes', 'Food Tours'],
      personalizedTip: 'Your AI will prioritize food experiences, local cuisine, and culinary hotspots in every itinerary.'
    },
    nature: {
      name: 'Nature Lover',
      description: 'You seek outdoor adventures and natural beauty',
      icon: <Mountain className="type-icon" />,
      color: '#22c55e',
      traits: ['Hiking Trails', 'National Parks', 'Wildlife Viewing', 'Scenic Routes'],
      personalizedTip: 'Your AI will focus on outdoor activities, nature reserves, and eco-friendly accommodations.'
    },
    culture: {
      name: 'Culture Seeker',
      description: 'You are drawn to history, art, and local traditions',
      icon: <Building className="type-icon" />,
      color: '#8b5cf6',
      traits: ['Museums', 'Historical Sites', 'Local Festivals', 'Art Galleries'],
      personalizedTip: 'Your AI will emphasize cultural sites, museums, and authentic local experiences.'
    },
    adventure: {
      name: 'Adventure Enthusiast',
      description: 'You crave excitement and thrilling experiences',
      icon: <Mountain className="type-icon" />,
      color: '#ef4444',
      traits: ['Extreme Sports', 'Adventure Activities', 'Off-beaten Path', 'Physical Challenges'],
      personalizedTip: 'Your AI will suggest adrenaline-pumping activities and off-the-beaten-path adventures.'
    },
    wellness: {
      name: 'Wellness Traveler',
      description: 'You prioritize relaxation and mental well-being',
      icon: <Heart className="type-icon" />,
      color: '#06b6d4',
      traits: ['Spa Treatments', 'Meditation', 'Peaceful Locations', 'Healthy Cuisine'],
      personalizedTip: 'Your AI will focus on wellness retreats, peaceful destinations, and rejuvenating activities.'
    },
    luxury: {
      name: 'Luxury Traveler',
      description: 'You enjoy premium experiences and high-end comfort',
      icon: <Star className="type-icon" />,
      color: '#eab308',
      traits: ['5-Star Hotels', 'Fine Dining', 'Premium Services', 'Exclusive Experiences'],
      personalizedTip: 'Your AI will prioritize luxury accommodations, premium services, and exclusive experiences.'
    },
    social: {
      name: 'Social Explorer',
      description: 'You love meeting people and vibrant social scenes',
      icon: <Users className="type-icon" />,
      color: '#ec4899',
      traits: ['Nightlife', 'Social Events', 'Group Activities', 'Local Communities'],
      personalizedTip: 'Your AI will highlight social hotspots, group activities, and opportunities to meet locals.'
    },
    heritage: {
      name: 'Heritage Explorer',
      description: 'You are fascinated by ancient history and traditions',
      icon: <Building className="type-icon" />,
      color: '#a855f7',
      traits: ['Ancient Sites', 'Archaeological Wonders', 'Traditional Crafts', 'Cultural Heritage'],
      personalizedTip: 'Your AI will focus on historical landmarks, archaeological sites, and cultural heritage experiences.'
    }
  };

  // AI-powered user classification using both local logic and backend AI
  const classifyUserWithAI = async (answers) => {
    try {
      // First try AI classification
      const response = await fetch('http://localhost:3000/ai/classify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return {
            userType: result.userType,
            source: 'AI',
            confidence: result.confidence || 0.85
          };
        }
      }
    } catch (error) {
      console.error('AI classification failed, using fallback:', error);
    }
    
    // Fallback to local classification
    const localType = classifyUserTypeLocally(answers);
    return {
      userType: localType,
      source: 'Local',
      confidence: 0.75
    };
  };

  const classifyUserTypeLocally = (answers) => {
    const scores = {};
    
    // Initialize scores
    Object.keys(userTypes).forEach(type => {
      scores[type] = 0;
    });

    // Calculate scores based on answers
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (!userAnswer) return;

      const answerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      
      answerArray.forEach(answer => {
        const option = question.options.find(opt => opt.value === answer);
        if (option && option.weight) {
          Object.entries(option.weight).forEach(([trait, weight]) => {
            // Map traits to user types
            const typeMapping = {
              foodie: 'foodie',
              nature: 'nature',
              culture: 'culture',
              heritage: 'heritage',
              adventure: 'adventure',
              wellness: 'wellness',
              luxury: 'luxury',
              social: 'social',
              cultural: 'culture',
              spiritual: 'wellness',
              aesthetic: 'culture',
              energetic: 'adventure',
              contemplative: 'wellness'
            };
            
            const mappedType = typeMapping[trait];
            if (mappedType && scores[mappedType] !== undefined) {
              scores[mappedType] += weight;
            }
          });
        }
      });
    });

    // Find the type with highest score
    const topType = Object.entries(scores).reduce((max, [type, score]) => 
      score > max.score ? { type, score } : max,
      { type: 'culture', score: 0 }
    );

    return topType.type;
  };

  // Generate AI insights about the user's travel personality
  const generateAIInsights = async (userType, answers) => {
    try {
      const response = await fetch('http://localhost:3000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on the travel quiz responses, provide personalized insights for a ${userType} traveler. Give 3-4 specific travel tips and recommendations that would appeal to this personality type.`,
          userProfile: { userType },
          tripContext: { quizCompleted: true }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.message;
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
    
    return `As a ${userTypes[userType]?.name}, you have a unique travel style that values ${userTypes[userType]?.traits.join(', ').toLowerCase()}. Our AI will customize every trip recommendation to match your preferences perfectly.`;
  };

  const handleAnswerChange = (questionId, value, isMultiple = false) => {
    if (isMultiple) {
      const currentAnswers = answers[questionId] || [];
      const maxSelections = questions[currentQuestion].maxSelections || 3;
      
      if (currentAnswers.includes(value)) {
        // Remove if already selected
        setAnswers(prev => ({
          ...prev,
          [questionId]: currentAnswers.filter(v => v !== value)
        }));
      } else if (currentAnswers.length < maxSelections) {
        // Add if under limit
        setAnswers(prev => ({
          ...prev,
          [questionId]: [...currentAnswers, value]
        }));
      }
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const saveUserProfile = async (userType, answers, aiInsights) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      const profile = {
        userType,
        quizAnswers: answers,
        aiInsights,
        completedAt: new Date().toISOString(),
        email: userEmail,
        aiEnhanced: true
      };

      // Save to sessionStorage (in a real app, save to backend)
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
      
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const completeQuiz = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate AI processing with step updates
      const steps = [...processingSteps];
      
      // Step 1: Analyzing responses
      steps[0].active = true;
      setProcessingSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 800));
      steps[0].completed = true;
      steps[0].active = false;
      
      // Step 2: AI processing
      steps[1].active = true;
      setProcessingSteps([...steps]);
      const classificationResult = await classifyUserWithAI(answers);
      await new Promise(resolve => setTimeout(resolve, 1000));
      steps[1].completed = true;
      steps[1].active = false;
      
      // Step 3: Generating profile
      steps[2].active = true;
      setProcessingSteps([...steps]);
      const insights = await generateAIInsights(classificationResult.userType, answers);
      await new Promise(resolve => setTimeout(resolve, 800));
      steps[2].completed = true;
      steps[2].active = false;
      
      // Step 4: Personalizing recommendations
      steps[3].active = true;
      setProcessingSteps([...steps]);
      await saveUserProfile(classificationResult.userType, answers, insights);
      await new Promise(resolve => setTimeout(resolve, 600));
      steps[3].completed = true;
      steps[3].active = false;
      
      setProcessingSteps([...steps]);
      
      // Set results
      setUserType(classificationResult.userType);
      setAiInsights(insights);
      setIsCompleted(true);
      setShowResult(true);
      
    } catch (error) {
      console.error('Error completing quiz:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    navigate('/user-dashboard');
  };

  const currentQuestionData = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = () => {
    const answer = answers[currentQuestionData.id];
    if (currentQuestionData.type === 'multiple') {
      return answer && answer.length > 0;
    }
    return answer !== undefined;
  };

  if (isProcessing) {
    return (
      <div className="quiz-loading">
        <div className="loading-content">
          <div className="ai-processing-visual">
            <Brain className="brain-icon animate-pulse" />
            <div className="processing-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
          
          <h2>AI is Analyzing Your Travel Personality...</h2>
          <p>Our advanced AI is processing your responses to create your perfect travel profile</p>
          
          <div className="processing-steps">
            {processingSteps.map((step) => (
              <div 
                key={step.id} 
                className={`processing-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
              >
                <div className="step-indicator">
                  {step.completed ? (
                    <CheckCircle className="step-icon completed" />
                  ) : step.active ? (
                    <div className="step-spinner"></div>
                  ) : (
                    <div className="step-circle"></div>
                  )}
                </div>
                <span className="step-text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showResult && userType) {
    const typeData = userTypes[userType];
    return (
      <div className="quiz-result">
        <div className="result-content">
          <div className="result-header">
            <div className="ai-badge">
              <Sparkles className="ai-badge-icon" />
              AI-Powered Result
            </div>
            
            <div className="type-icon-container" style={{ backgroundColor: typeData.color }}>
              {typeData.icon}
            </div>
            <h1>You are a {typeData.name}!</h1>
            <p className="type-description">{typeData.description}</p>
            <p className="personalized-tip">{typeData.personalizedTip}</p>
          </div>

          <div className="traits-section">
            <h3>Your Travel Preferences Include:</h3>
            <div className="traits-grid">
              {typeData.traits.map((trait, index) => (
                <div key={index} className="trait-card">
                  <CheckCircle className="trait-check" />
                  <span>{trait}</span>
                </div>
              ))}
            </div>
          </div>

          {aiInsights && (
            <div className="ai-insights-section">
              <h3>🤖 AI Personalized Insights</h3>
              <div className="insights-content">
                <p>{aiInsights}</p>
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="continue-btn" onClick={handleContinue}>
              <Sparkles className="btn-icon" />
              Start AI-Powered Planning
              <ArrowRight className="btn-icon" />
            </button>
            <button className="retake-btn" onClick={() => window.location.reload()}>
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="question-counter">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-section">
          <div className="question-header">
            {currentQuestionData.icon}
            <h2 className="question-title">{currentQuestionData.question}</h2>
          </div>
          
          <div className="options-container">
            {currentQuestionData.options.map((option, index) => {
              const isSelected = currentQuestionData.type === 'multiple'
                ? (answers[currentQuestionData.id] || []).includes(option.value)
                : answers[currentQuestionData.id] === option.value;

              return (
                <div
                  key={index}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(
                    currentQuestionData.id, 
                    option.value, 
                    currentQuestionData.type === 'multiple'
                  )}
                >
                  <div className="option-content">
                    <div className="option-emoji">{option.emoji}</div>
                    <div className="option-text">{option.label}</div>
                    {isSelected && <CheckCircle className="selected-icon" />}
                  </div>
                </div>
              );
            })}
          </div>

          {currentQuestionData.type === 'multiple' && (
            <div className="selection-hint">
              <Target className="hint-icon" />
              Select up to {currentQuestionData.maxSelections} options that best describe you
            </div>
          )}
        </div>

        <div className="quiz-navigation">
          <button 
            className="nav-btn prev-btn" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="nav-icon" />
            Previous
          </button>

          <button 
            className={`nav-btn next-btn ${canProceed() ? 'enabled' : 'disabled'}`}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {isLastQuestion ? (
              <>
                <Brain className="nav-icon" />
                Analyze with AI
              </>
            ) : (
              <>
                Next
                <ArrowRight className="nav-icon" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserQuizUI;
