// --- Render Quiz from Data ---
function renderQuizFromData() {
    if (!window.QUIZ_DATA) return;
    document.getElementById('quizTitle').textContent = window.QUIZ_DATA.title || 'Quiz';
    const container = document.getElementById('quizQuestionsContainer');
    container.innerHTML = '';
    (window.QUIZ_DATA.questions || []).forEach((q, idx) => {
        const section = document.createElement('div');
        section.className = 'form-section';

        // Question text
        const h3 = document.createElement('h3');
        h3.textContent = q.question;
        section.appendChild(h3);

        // Question image
        if (q.question_image) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'question-image-container';
            const img = document.createElement('img');
            img.src = '/media/quiz/' + q.question_image;
            img.alt = 'Question Image';
            img.className = 'question-image';
            imgDiv.appendChild(img);
            section.appendChild(imgDiv);
        }

        // Options
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options-container';
        (q.options || []).forEach((opt, oidx) => {
            const label = document.createElement('label');
            label.className = 'option-with-image';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'q' + idx;
            radio.value = oidx;
            radio.setAttribute('status', opt.correct ? 'true' : 'false');

            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';

            if (opt.option_image) {
                const img = document.createElement('img');
                img.src = '/media/quiz/' + opt.option_image;
                img.alt = 'Option Image';
                img.className = 'option-image';
                optionContent.appendChild(img);
            }

            const span = document.createElement('span');
            span.textContent = opt.option;
            optionContent.appendChild(span);

            label.appendChild(radio);
            label.appendChild(optionContent);
            optionsDiv.appendChild(label);
        });
        section.appendChild(optionsDiv);
        container.appendChild(section);
    });
}

// Lightbox functionality
function openLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="close-lightbox">&times;</span>
        <img src="${imageSrc}" class="lightbox-content" alt="Enlarged view">
    `;
    document.body.appendChild(lightbox);
    lightbox.style.display = 'block';

    // Close lightbox on click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.className === 'close-lightbox') {
            lightbox.remove();
        }
    });
}

// Handle image-based questions
function handleImageQuestion(question) {
    const questionContainer = document.createElement('div');
    questionContainer.className = 'form-section';
    
    // Question text
    const questionText = document.createElement('h3');
    questionText.textContent = question.text;
    questionContainer.appendChild(questionText);

    // Question image if exists
    if (question.image) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'question-image-container';
        const image = document.createElement('img');
        image.src = question.image;
        image.alt = 'Question image';
        image.className = 'question-image';
        image.addEventListener('click', () => openLightbox(question.image));
        imageContainer.appendChild(image);
        questionContainer.appendChild(imageContainer);
    }

    // Options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';

    // Create options
    question.options.forEach((option, index) => {
        const optionWrapper = document.createElement('label');
        optionWrapper.className = 'option-with-image';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question_${question.id}`;
        radio.value = index;
        radio.style.display = 'none';

        const optionContent = document.createElement('div');
        optionContent.className = 'option-content';

        if (option.image) {
            const optionImage = document.createElement('img');
            optionImage.src = option.image;
            optionImage.alt = `Option ${index + 1}`;
            optionImage.className = 'option-image';
            optionImage.addEventListener('click', () => openLightbox(option.image));
            optionContent.appendChild(optionImage);
        }

        const optionText = document.createElement('span');
        optionText.textContent = option.text;
        optionContent.appendChild(optionText);

        optionWrapper.appendChild(radio);
        optionWrapper.appendChild(optionContent);
        optionsContainer.appendChild(optionWrapper);
    });

    questionContainer.appendChild(optionsContainer);
    return questionContainer;
}

function resetRadioAndCheckboxInputs() {
    console.log("resetRadioAndCheckboxInputs");
    const inputElements = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');

    inputElements.forEach(element => {
        element.checked = false; // Uncheck the element
    });
}

function resetTextAndFileInputs() {
    const inputElements = document.querySelectorAll('input[type="text"], input[type="file"]');
    inputElements.forEach(element => {
        element.value = '';
    });
}
  
console.log("clearFormButton", document.getElementById('clearFormButton'));
// Clear form function
document.getElementById('clearFormButton').addEventListener('click', async function() {
    if (await confirm("Are you sure you want to clear the form?")) {
        console.log("clearForm");
        const form = document.querySelector('form');
        form.reset();
        resetRadioAndCheckboxInputs();
        resetTextAndFileInputs();
    }
});

async function submitQuiz(e, toconfirm=true) {
    e.preventDefault();
    e.stopPropagation();

    if (toconfirm) { 
        if (!await confirm('Are you sure to submit this quiz?')) return;
    } else {
        alert('You broke the rules more than 3 times. Now your quiz will automatically be submitted');
    }

    // Ensure globals exist
    if (typeof quizAttemptStart === 'undefined') {
        console.error('quizAttemptStart is not defined.');
        return;
    }

    const quiz = window.QUIZ_DATA;
    const attemptTime = quizAttemptStart.toISOString();
    const submitTime = new Date().toISOString();

    // Calculate time taken
    const diffMs = new Date(submitTime) - quizAttemptStart;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const timeTaken = `${hours}h ${minutes}m ${seconds}s`;

    let totalScore = 0;
    const questions = [];

    (quiz.questions || []).forEach((q, idx) => {
        const qObj = {
            question: q.question,
            question_image: q.question_image,
            points: q.points,
            correct: false,
            got_points: 0,
            options: []
        };

        let answeredCorrect = false;
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        const answeredIdx = selected ? parseInt(selected.value) : -1;

        (q.options || []).forEach((opt, oidx) => {
            const answered = (oidx === answeredIdx);
            const isCorrect = !!opt.correct;

            qObj.options.push({
                option: opt.option,
                option_image: opt.option_image,
                correct: isCorrect,
                answered: answered
            });

            if (answered && isCorrect) answeredCorrect = true;
        });

        if (answeredCorrect) {
            qObj.correct = true;
            qObj.got_points = q.points;
            totalScore += q.points;
        }

        questions.push(qObj);
    });

    const answer = {
        title: quiz.title,
        attempt_time: attemptTime,
        submit_time: submitTime,
        time_taken: timeTaken,
        total_score: totalScore,
        copied_times: window.copyCount || 0,
        window_switch_times: window.windowChange || 0,
        questions: questions
    };

    try {
        const response = await fetch('/students/academics/quiz/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({
                assessment_id: window.assessment_id,
                answer: answer
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        // Redirect only if success
        window.location.href = '/students/academics/home/';
    } catch (err) {
        alert("Failed to submit quiz. Please try again.");
        console.error(err);
    }
}

// Initialize the quiz
document.addEventListener('DOMContentLoaded', function() {
    if (window.QUIZ_DATA) {
        renderQuizFromData();
    }
    // Add click event listeners for all images
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('question-image') || e.target.classList.contains('option-image')) {
            openLightbox(e.target.src);
        }
    });

    // Prevent form submission and show answers
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', submitQuiz);
    }
});

// Timer functionality
let timeLeft = QUIZ_DATA.time_limit;
let timerInterval;

function startTimer() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Create timer container if it doesn't exist
    let timerContainer = document.querySelector('.timer-container');
    if (!timerContainer) {
        timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.innerHTML = `
            <div class="timer-content">
                <div class="clock-face">
                    <div class="clock-center"></div>
                    <div class="clock-hand hour-hand"></div>
                    <div class="clock-hand minute-hand"></div>
                    <div class="clock-hand second-hand"></div>
                </div>
                <div class="digital-timer">30:00</div>
            </div>
        `;
        
        // Insert after the main section
        const mainSection = document.querySelector('.form-section.main');
        mainSection.insertAdjacentElement('afterend', timerContainer);
    }

    // Update timer every second
    timerInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('submitButton').click();
            document.querySelector('.timer-container').style.display = 'none';
            return;
        }

        // Update digital display
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const digitalDisplay = timerContainer.querySelector('.digital-timer');
        digitalDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update clock hands
        const secondHand = timerContainer.querySelector('.second-hand');
        const minuteHand = timerContainer.querySelector('.minute-hand');
        const hourHand = timerContainer.querySelector('.hour-hand');

        // Calculate angles
        const secondDegrees = (timeLeft % 60) * 6; // 360 degrees / 60 seconds
        const minuteDegrees = (Math.floor(timeLeft / 60) % 60) * 6; // 360 degrees / 60 minutes
        const hourDegrees = (Math.floor(timeLeft / 3600) % 12) * 30; // 360 degrees / 12 hours

        // Apply rotations
        secondHand.style.transform = `rotate(${secondDegrees}deg)`;
        minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
        hourHand.style.transform = `rotate(${hourDegrees}deg)`;
    }, 1000);
}

// Start timer when page loads
document.addEventListener('DOMContentLoaded', function() {
    startTimer();
});

// Add styles for timer
const timerStyle = document.createElement('style');
timerStyle.textContent = `
    .timer-container {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: var(--shadow-md);
        text-align: center;
    }

    .timer-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
    }

    .clock-face {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: #f8f9fa;
        border: 2px solid var(--primary-color);
        position: relative;
    }

    .clock-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        background: var(--primary-color);
        border-radius: 50%;
        transform: translate(-50%, -50%);
    }

    .clock-hand {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform-origin: bottom;
        background: var(--primary-color);
        border-radius: 4px;
    }

    .hour-hand {
        width: 4px;
        height: 25px;
        margin-left: -2px;
    }

    .minute-hand {
        width: 3px;
        height: 35px;
        margin-left: -1.5px;
    }

    .second-hand {
        width: 2px;
        height: 40px;
        margin-left: -1px;
        background: var(--danger-color);
    }

    .digital-timer {
        font-size: 2rem;
        font-weight: 600;
        color: var(--primary-color);
        font-family: monospace;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .timer-container.warning {
        animation: pulse 1s infinite;
    }
`;
document.head.appendChild(timerStyle);

// Add styles for answer icons and points display
const style = document.createElement('style');
style.textContent = `
    .answer-icon {
        margin-left: 8px;
        font-size: 1.2em;
        font-weight: bold;
        display: inline-block;
    }
    
    .answer-feedback {
        margin-top: 8px;
        padding: 8px;
        border-radius: 4px;
        background-color: rgba(34, 197, 94, 0.1);
    }
    
    .correct-answer {
        color: #22c55e;
        font-weight: 500;
    }
    
    .form-section {
        transition: background-color 0.3s ease;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
    }

    .option-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Styles for regular MCQ labels */
    .form-section > label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        cursor: pointer;
    }

    .points-display {
        margin-top: 12px;
        padding: 8px;
        background-color: #f8f9fa;
        border-radius: 4px;
        text-align: right;
    }

    .marks {
        font-weight: 500;
        color: #2c3e50;
    }

    .total-score {
        margin-top: 24px;
        padding: 16px;
        background-color: #f8f9fa;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .total-score h3 {
        color: #2c3e50;
        margin: 0;
    }
`;
document.head.appendChild(style); 

let quizAttemptStart = new Date();
let copyCount = 0;
let windowChange = 0;

function warnUser(type, count) {
    if (count==4) {
        submitQuiz(new Event('submit'), false);
    } else {
        if (type=='copy') {
            alert(`Copying is not allowed in quiz. If you do it ${4-count} more times, quiz will be submitted automatically.`);
            return;
        } else {
            alert(`You cannot switch to another window. You are in quiz mode. If you do this ${4-count} more times, your quiz will be submitted automatically`);
            return;
        }
    }
}


// Listen for copy and window switch events (already present in your code)
document.addEventListener('copy', ()=> { 
    copyCount += 1; 
    warnUser('copy', copyCount);
});
var visibilityChange;
if (typeof document.hidden !== "undefined") {
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  visibilityChange = "webkitvisibilitychange";
}
document.addEventListener(visibilityChange, function() {
  if (document.visibilityState !== 'visible') {
    windowChange += 1;
    warnUser('window', windowChange);
  }
});
