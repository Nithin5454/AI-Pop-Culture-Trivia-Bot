// DOM Elements
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const scoreElement = document.getElementById('score');

// Set your API key here
const API_KEY = 'AIzaSyBkawVw1Cy-2EaH0nptfqB3FooYtrJbgpE'; // Replace with your actual API key

// Game state
let currentScore = 0;
let currentAnswer = '';
let isWaitingForAnswer = false;
let questionsAnswered = 0;
let correctAnswers = 0;
let gameStartTime = null;

// Event Listeners
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Initialize chat
function init() {
  addMessage('bot', `👋 Welcome to Pop Culture Trivia! 

I'm your trivia host bot. Here's how to play:

1. Type 'start' or 's' to get a new question
2. Type your answer (A, B, C, or D)
3. Each correct answer gets you 10 points!

Additional commands:
- 'new' to start a new game
- 'stats' to see your game statistics
- 'help' to see these instructions again

Ready? Type 'start' to begin! 🎮`);
}

// Add message to chat
function addMessage(type, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  // Format multiple choice questions nicely
  if (text.includes('A.') && text.includes('B.')) {
    const parts = text.split('\n');
    const formattedText = parts.map(part => {
      if (part.startsWith('A.') || part.startsWith('B.') ||
        part.startsWith('C.') || part.startsWith('D.')) {
        return `<div class="option">${part}</div>`;
      }
      return part;
    }).join('\n');
    messageDiv.innerHTML = formattedText;
  } else {
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Start new game
function startNewGame() {
  currentScore = 0;
  questionsAnswered = 0;
  correctAnswers = 0;
  gameStartTime = new Date();
  scoreElement.textContent = '0';

  addMessage('bot', `🎮 Starting a new game! All scores have been reset.

Your mission: Test your pop culture knowledge and aim for a high score!
Each correct answer is worth 10 points.

Type 'start' for your first question!`);
}

// Show game statistics
function showStats() {
  const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  let playTime = 'No active game';

  if (gameStartTime) {
    const timeDiff = Math.round((new Date() - gameStartTime) / 1000); // in seconds
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    playTime = `${minutes}m ${seconds}s`;
  }

  addMessage('bot', `📊 Game Statistics:
• Score: ${currentScore} points
• Questions Answered: ${questionsAnswered}
• Correct Answers: ${correctAnswers}
• Accuracy: ${accuracy}%
• Play Time: ${playTime}

Type 'start' for another question or 'new' to start fresh!`);
}

// Add typing animation
function addTypingAnimation() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    typingDiv.appendChild(dot);
  }
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return typingDiv;
}

// Handle sending message
async function handleSendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Clear input
  userInput.value = '';

  // Add user message to chat
  addMessage('user', message);

  // Add typing animation
  const typingDiv = addTypingAnimation();

  try {
    // Initialize game time if not set
    if (!gameStartTime && message.toLowerCase() !== 'new') {
      gameStartTime = new Date();
    }

    // Handle different commands
    switch (message.toLowerCase()) {
      case 'start':
      case 's':
        const question = await getTrivia();
        chatBox.removeChild(typingDiv);
        addMessage('bot', question);
        isWaitingForAnswer = true;
        break;

      case 'new':
        chatBox.removeChild(typingDiv);
        startNewGame();
        break;

      case 'stats':
        chatBox.removeChild(typingDiv);
        showStats();
        break;

      case 'help':
        chatBox.removeChild(typingDiv);
        init();
        break;

      default:
        if (isWaitingForAnswer) {
          // Check answer
          const userAnswer = message.toUpperCase().trim();
          if (!['A', 'B', 'C', 'D'].includes(userAnswer)) {
            chatBox.removeChild(typingDiv);
            addMessage('bot', 'Please answer with A, B, C, or D only! Try again.');
            return;
          }

          const isCorrect = userAnswer === currentAnswer.toUpperCase().trim();
          chatBox.removeChild(typingDiv);

          questionsAnswered++;
          if (isCorrect) {
            currentScore += 10;
            correctAnswers++;
            scoreElement.textContent = currentScore;
            addMessage('bot', `🎉 Correct! +10 points!\nYour current score: ${currentScore}\n\nType 'start' for another question or 'stats' to see your progress!`);
          } else {
            addMessage('bot', `❌ Incorrect! The correct answer was ${currentAnswer}.\n\nType 'start' for another question or 'new' to start fresh!`);
          }

          isWaitingForAnswer = false;
        } else {
          // General chat
          chatBox.removeChild(typingDiv);
          addMessage('bot', `Type 'start' for a new question, 'stats' to see your progress, or 'help' for instructions!`);
        }
    }
  } catch (error) {
    chatBox.removeChild(typingDiv);
    addMessage('bot', 'Sorry, there was an error. Please try again!');
    console.error('Error:', error);
  }
}

// Get trivia question from Gemini API
async function getTrivia() {
  const prompt = `You are a pop culture trivia expert. Generate a fun multiple choice question about movies, TV shows, music, video games, or celebrities.

Follow this EXACT format (including newlines):
Q: [Your interesting pop culture question]
A. [First option]
B. [Second option]
C. [Third option]
D. [Fourth option]
Answer: [Just the letter A, B, C, or D]

Make it challenging but fun! Don't make the answer too obvious.`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const response = await fetch(`${url}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  const data = await response.json();
  const fullResponse = data.candidates[0].content.parts[0].text;

  // Extract answer and question separately
  const lines = fullResponse.split('\n');
  let answerLine = '';

  // Find the answer line
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('Answer:')) {
      answerLine = lines[i];
      lines.splice(i, 1);
      break;
    }
  }

  // Extract just the letter from "Answer: X"
  currentAnswer = answerLine.replace('Answer:', '').trim();
  console.log('Setting current answer to:', currentAnswer); // Debug log

  // Return only the question and options
  return lines.join('\n');
}

// Initialize the chat when page loads
init(); 