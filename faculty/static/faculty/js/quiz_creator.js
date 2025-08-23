// Sample student data
const students = window.ALL_STUDENTS;

let selectedStudents = []; 
let questionCounter = 1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeStudentModal();
    initializeTimerControls();
    setupEventListeners();
    updateClockDisplay();

    // If quiz data exists, fill the form
    if (window.quiz_data) {
        fillQuizForm(window.quiz_data);
        document.getElementById('questionsPerStudent').value = window.quiz_data.questions_per_student;
    }

    // Initialize existing option inputs
    document.querySelectorAll('.option-item input[type="text"]').forEach(input => {
        input.addEventListener('input', function() {
            updateCorrectPreview(this);
        });
    });
});

// Student Modal Functions
function initializeStudentModal() {
    const studentsGrid = document.getElementById('studentsGrid');
    studentsGrid.innerHTML = '';
    
    students.forEach(student => {
        const studentCard = createStudentCard(student);
        studentsGrid.appendChild(studentCard);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.dataset.studentId = student.id;
    
    card.innerHTML = `
        <div class="student-checkbox">
            <label class="checkbox-container">
                <input type="checkbox" onchange="toggleStudentSelection(${student.id})">
                <span class="checkmark"></span>
            </label>
        </div>
        <div class="student-avatar">${student.avatar}</div>
        <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-details">
                ${student.email}<br>
                Roll No.: ${student.roll_no}
            </div>
        </div>
    `;
    
    card.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox' && !e.target.closest('.checkbox-container')) {
            const checkbox = card.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            toggleStudentSelection(student.id);
        }
    });
    
    return card;
}

function openStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function toggleStudentSelection(studentId) {
    const card = document.querySelector(`[data-student-id="${studentId}"]`);
    const checkbox = card.querySelector('input[type="checkbox"]');
    
    if (checkbox.checked) {
        if (!selectedStudents.includes(studentId)) {
            selectedStudents.push(studentId);
        }
        card.classList.add('selected');
    } else {
        selectedStudents = selectedStudents.filter(id => id !== studentId);
        card.classList.remove('selected');
    }
    
    updateSelectAllCheckbox();
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    const studentCheckboxes = document.querySelectorAll('.student-card input[type="checkbox"]');
    
    if (selectAllCheckbox.checked) {
        selectedStudents = students.map(s => s.id);
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.student-card').classList.add('selected');
        });
    } else {
        selectedStudents = [];
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.student-card').classList.remove('selected');
        });
    }
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    selectAllCheckbox.checked = selectedStudents.length === students.length;
}

function confirmStudentSelection() {
    updateSelectedStudentsDisplay();
    closeStudentModal();
}

function updateSelectedStudentsDisplay() {
    const selectedCount = document.getElementById('selectedCount');
    selectedCount.textContent = `${selectedStudents.length} students selected`;
}

// Search functionality
function setupStudentSearch() {
    const searchInput = document.getElementById('studentSearch');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const studentCards = document.querySelectorAll('.student-card');
        
        studentCards.forEach(card => {
            const studentName = card.querySelector('.student-name').textContent.toLowerCase();
            const studentEmail = card.querySelector('.student-details').textContent.toLowerCase();
            
            if (studentName.includes(searchTerm) || studentEmail.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Timer Controls
function initializeTimerControls() {
    const durationInput = document.getElementById('quizDuration');
    durationInput.addEventListener('input', updateClockDisplay);
}

function adjustTime(minutes) {
    const durationInput = document.getElementById('quizDuration');
    let currentValue = parseInt(durationInput.value) || 30;
    let newValue = currentValue + minutes;
    
    if (newValue < 1) newValue = 1;
    if (newValue > 300) newValue = 300;
    
    durationInput.value = newValue;
    updateClockDisplay();
}

function updateClockDisplay() {
    const duration = parseInt(document.getElementById('quizDuration').value) || 30;
    const timeDisplay = document.getElementById('timeDisplay');
    const hourHand = document.getElementById('hourHand');
    const minuteHand = document.getElementById('minuteHand');
    
    // Format time display
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Update clock hands - fix the rotation
    const minuteAngle = (minutes / 60) * 360;
    const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    
    if (minuteHand) {
        minuteHand.style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`;
    }
    if (hourHand) {
        hourHand.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
    }
}

// Image Preview Functions
function previewQuestionImage(input) {
    const questionNumber = input.id.replace('questionImg', '');
    const previewContainer = document.getElementById(`imagePreview${questionNumber}`);
    const previewImg = previewContainer.querySelector('.preview-img');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeQuestionImage(questionNumber) {
    const fileInput = document.getElementById(`questionImg${questionNumber}`);
    const previewContainer = document.getElementById(`imagePreview${questionNumber}`);

    fileInput.value = '';
    previewContainer.style.display = 'none';
}

// Question Management
function addQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    const questionCount = questionsContainer.children.length + 1;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.dataset.question = questionCount;
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${questionCount}</span>
            <div class="question-actions">
                <label for="questionImg${questionCount}" class="file-upload-label">
                    <i class="fas fa-image"></i>
                </label>
                <input type="file" accept="image/*" id="questionImg${questionCount}" onchange="previewQuestionImage(this)" style="display: none;">
                <button type="button" class="btn-danger remove-question" onclick="removeQuestion(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        <div class="question-content">
            <div class="form-group">
                <label>Question Text:</label>
                <textarea placeholder="Enter your question here..." required rows="1"></textarea>
            </div>

            <div class="image-preview" id="imagePreview${questionCount}" style="display: none;">
                <img src="" alt="Question Image Preview" class="preview-img">
                <button type="button" class="btn-danger remove-image" onclick="removeQuestionImage(${questionCount})">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="options-section">
                <div class="options-header">
                    <label>Answer Options:</label>
                    <button type="button" class="btn-secondary add-option" onclick="addOption(this)">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>

                <div class="options-container">
                    <div class="option-content">
                        <input type="text" placeholder="Option 1" required onchange="updateCorrectPreview(this)">
                        <div class="option-actions">
                            <label for="optionImg${questionCount}_1" class="file-upload-label">
                                <i class="fas fa-image"></i>
                            </label>
                            <input type="file" accept="image/*" id="optionImg${questionCount}_1" onchange="previewOptionImage(this)" style="display: none;">
                            <button type="button" class="btn-danger remove-option" onclick="removeOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="option-image-preview" id="optionImagePreview${questionCount}_1" style="display: none;">
                            <img src="" alt="Option Image Preview" class="preview-img">
                            <button type="button" class="btn-danger remove-image" onclick="removeOptionImage('${questionCount}_1')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="option-content">
                        <input type="text" placeholder="Option 2" required onchange="updateCorrectPreview(this)">
                        <div class="option-actions">
                            <label for="optionImg${questionCount}_2" class="file-upload-label">
                                <i class="fas fa-image"></i>
                            </label>
                            <input type="file" accept="image/*" id="optionImg${questionCount}_2" onchange="previewOptionImage(this)" style="display: none;">
                            <button type="button" class="btn-danger remove-option" onclick="removeOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="option-image-preview" id="optionImagePreview${questionCount}_2" style="display: none;">
                            <img src="" alt="Option Image Preview" class="preview-img">
                            <button type="button" class="btn-danger remove-image" onclick="removeOptionImage('${questionCount}_2')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="correct-answer-section">
                <div class="correct-answer-header">
                    <label>Correct Answer:</label>
                    <div class="points-input">
                        <label for="points${questionCount}">Points:</label>
                        <input type="number" id="points${questionCount}" name="points${questionCount}" min="1" value="1" class="points-field">
                    </div>
                </div>
                <div class="correct-options-preview" id="correctPreview${questionCount}">
                    <div class="preview-option" data-value="1" onclick="selectCorrectOption(this, ${questionCounter})">
                        <span class="option-label">A</span>
                        <span class="option-text">
                            <img src="" alt="Option Image" class="option-image">
                            Option 1
                        </span>
                    </div>
                    <div class="preview-option" data-value="2" onclick="selectCorrectOption(this, ${questionCounter})">
                        <span class="option-label">B</span>
                        <span class="option-text">
                            <img src="" alt="Option Image" class="option-image">
                            Option 2
                        </span>
                    </div>
                </div>
                <input type="hidden" class="correct-answer" name="correctAnswer${questionCount}">
            </div>
        </div>
    `;
    
    questionsContainer.appendChild(questionDiv);
    updateMaxQuestions();
}

function updateMaxQuestions() {
    const questionCount = document.getElementById('questionsContainer').children.length;
    const maxQuestionsSpan = document.getElementById('maxQuestions');
    const questionsPerStudentInput = document.getElementById('questionsPerStudent');
    
    maxQuestionsSpan.textContent = questionCount;
    
    // Update max attribute of questions per student input
    questionsPerStudentInput.max = questionCount;
    
    // If current value exceeds max, update it
    if (parseInt(questionsPerStudentInput.value) > questionCount) {
        questionsPerStudentInput.value = questionCount;
    }
}

function removeQuestion(button) {
    const question = button.closest('.question');
    question.remove();
    updateMaxQuestions();
}

// Add event listener for questions per student input
document.getElementById('questionsPerStudent').addEventListener('input', function(e) {
    const maxQuestions = parseInt(document.getElementById('maxQuestions').textContent);
    const value = parseInt(e.target.value);
    
    if (value > maxQuestions) {
        e.target.value = maxQuestions;
    }
});

// Option Management
function previewOptionImage(input) {
    const optionContent = input.closest('.option-content');
    const previewContainer = optionContent.querySelector('.option-image-preview');
    const previewImg = previewContainer.querySelector('.preview-img');
    const optionNumber = optionContent.closest('.question').dataset.question;
    const optionIndex = Array.from(optionContent.parentElement.children).indexOf(optionContent) + 1;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewContainer.style.display = 'flex';
            
            // Update the correct answer preview
            const correctPreview = document.getElementById(`correctPreview${optionNumber}`);
            const previewOption = correctPreview.querySelector(`[data-value="${optionIndex}"]`);
            const optionImage = previewOption.querySelector('.option-image');
            
            // optionImage.src = e.target.result;
            previewOption.classList.add('has-image');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

function removeOptionImage(optionNumber) {
    const optionContent = document.querySelector(`#optionImagePreview${optionNumber}`).closest('.option-content');
    const previewContainer = optionContent.querySelector('.option-image-preview');
    const previewImg = previewContainer.querySelector('.preview-img');
    const fileInput = optionContent.querySelector('input[type="file"]');
    const questionNumber = optionContent.closest('.question').dataset.question;
    const optionIndex = Array.from(optionContent.parentElement.children).indexOf(optionContent) + 1;

    // Clear the file input
    fileInput.value = '';
    // Hide the preview
    previewContainer.style.display = 'none';
    previewImg.src = '';

    // Mark as deleted for backend
    fileInput.dataset.deleted = "1";

    // Update the correct answer preview
    const correctPreview = document.getElementById(`correctPreview${questionNumber}`);
    const previewOption = correctPreview.querySelector(`[data-value="${optionIndex}"]`);
    if (previewOption) {
        const optionImage = previewOption.querySelector('.option-image');
        if (optionImage) {
            optionImage.src = '';
        }
        previewOption.classList.remove('has-image');
    }
}

function addOption(button) {
    const optionsContainer = button.closest('.options-section').querySelector('.options-container');
    const questionDiv = button.closest('.question');
    const questionNumber = questionDiv.dataset.question;
    const newOptionIndex = optionsContainer.children.length + 1;

    const optionContent = document.createElement('div');
    optionContent.className = 'option-content';
    optionContent.innerHTML = `
        <input type="text" placeholder="Option ${newOptionIndex}" required onchange="updateCorrectPreview(this)">
        <div class="option-actions">
            <label for="optionImg${questionNumber}_${newOptionIndex}" class="file-upload-label">
                <i class="fas fa-image"></i>
            </label>
            <input type="file" accept="image/*" id="optionImg${questionNumber}_${newOptionIndex}" onchange="previewOptionImage(this)" style="display: none;">
            <button type="button" class="btn-danger remove-option" onclick="removeOption(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="option-image-preview" id="optionImagePreview${questionNumber}_${newOptionIndex}" style="display: none;">
            <img src="" alt="Option Image Preview" class="preview-img">
            <button type="button" class="btn-danger remove-image" onclick="removeOptionImage('${questionNumber}_${newOptionIndex}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    optionsContainer.appendChild(optionContent);

    // Add corresponding preview option to correct-options-preview
    const correctPreview = questionDiv.querySelector('.correct-options-preview');
    const optionLetter = String.fromCharCode(65 + (newOptionIndex - 1));
    const previewOption = document.createElement('div');
    previewOption.className = 'preview-option';
    previewOption.dataset.value = newOptionIndex;
    previewOption.setAttribute('onclick', `selectCorrectOption(this, ${questionNumber})`);
    previewOption.innerHTML = `
        <span class="option-label">${optionLetter}</span>
        <span class="option-text">Option ${newOptionIndex}</span>
    `;
    correctPreview.appendChild(previewOption);

    updateCorrectPreview(optionContent.querySelector('input[type="text"]'));
}

async function removeOption(button) {
    const optionItem = button.closest('.option-content');
    if (!optionItem) return; // Defensive: if not found, do nothing
    const question = button.closest('.question');
    const optionsContainer = question.querySelector('.options-container');
    const correctPreview = question.querySelector('.correct-options-preview');

    // Don't allow removing if only 2 options remain
    if (optionsContainer.children.length <= 2) {
        await alert('A question must have at least 2 options.');
        return;
    }

    const optionNumber = Array.from(optionsContainer.children).indexOf(optionItem) + 1;

    // Remove the option
    optionItem.remove();

    // Remove corresponding preview option
    const previewOption = correctPreview.querySelector(`[data-value="${optionNumber}"]`);
    if (previewOption) {
        previewOption.remove();
    }

    // Renumber remaining options
    renumberOptions(question);
}

function renumberOptions(question) {
    const optionItems = question.querySelectorAll('.option-item');
    const previewOptions = question.querySelectorAll('.preview-option');
    const questionNumber = question.dataset.question;

    optionItems.forEach((item, index) => {
        const optionNumber = index + 1;

        item.dataset.option = optionNumber;
        const textInput = item.querySelector('input[type="text"]');
        textInput.placeholder = `Option ${optionNumber}`;
    });

    previewOptions.forEach((option, index) => {
        const optionNumber = index + 1;
        const optionLetter = String.fromCharCode(64 + optionNumber);

        option.dataset.value = optionNumber;
        option.querySelector('.option-label').textContent = optionLetter;
        option.querySelector('.option-text').textContent = `Option ${optionNumber}`;
        option.setAttribute('onclick', `selectCorrectOption(this, ${questionNumber})`);
    });
}

function updateCorrectPreview(input) {
    const optionContent = input.closest('.option-content');
    const optionIndex = Array.from(optionContent.parentElement.children).indexOf(optionContent);
    const questionDiv = input.closest('.question');
    const questionNumber = questionDiv.dataset.question;
    const correctPreview = document.getElementById(`correctPreview${questionNumber}`);
    const previewOption = correctPreview.children[optionIndex];
    const optionText = previewOption.querySelector('.option-text');
    const optionImage = optionText.querySelector('.option-image');
    
    // Update option text
    optionText.textContent = input.value;
    
    // Check if there's an image preview for this option
    const imagePreview = document.getElementById(`optionImagePreview${questionNumber}_${optionIndex + 1}`);
    if (imagePreview && imagePreview.style.display !== 'none') {
        const previewImg = imagePreview.querySelector('img');
        if (previewImg && previewImg.src) {
            // Create image element if it doesn't exist
            if (!optionImage) {
                const img = document.createElement('img');
                img.className = 'option-image';
                img.alt = 'Option Image';
                optionText.insertBefore(img, optionText.firstChild);
            }
            // Update image source
            optionImage.src = previewImg.src;
            optionImage.style.display = 'inline-block';
        } else {
            // Remove image if no source
            if (optionImage) {
                optionImage.remove();
            }
        }
    } else {
        // Remove image if no preview
        if (optionImage) {
            optionImage.remove();
        }
    }
}

function selectCorrectOption(element, questionNumber) {
    const question = element.closest('.question');
    const allPreviewOptions = question.querySelectorAll('.preview-option');
    const hiddenInput = question.querySelector('.correct-answer');

    // Remove selected class from all options
    allPreviewOptions.forEach(option => option.classList.remove('selected'));

    // Add selected class to clicked option
    element.classList.add('selected');

    // Update hidden input value
    hiddenInput.value = element.dataset.value;
}

// Event Listeners Setup
function setupEventListeners() {
    // Student modal button
    document.getElementById('openStudentModal').addEventListener('click', openStudentModal);

    // Add question button
    document.getElementById('addQuestion').addEventListener('click', addQuestion);

    // Form submission
    document.getElementById('quizForm').addEventListener('submit', handleFormSubmission);

    // Setup student search
    setupStudentSearch();

    // Close modal when clicking outside
    document.getElementById('studentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStudentModal();
        }
    });
}

async function handleFormSubmission(event) {
    event.preventDefault();

    // Validate that students are selected
    if (selectedStudents.length === 0) {
        await alert('Please select at least one student for the quiz.');
        return;
    }

    // Validate that all questions have correct answers selected
    const questions = document.querySelectorAll('.question');
    let allValid = true;

    questions.forEach(async (question, index) => {
        const correctAnswer = question.querySelector('.correct-answer').value;
        if (!correctAnswer) {
            await alert(`Please select a correct answer for Question ${index + 1}.`);
            allValid = false;
            return;
        }
    });

    if (!allValid) return;

    // Build quiz JSON
    const quizTitle = document.getElementById('quizTitle') ? document.getElementById('quizTitle').value : '';
    const timeLimit = parseInt(document.getElementById('quizDuration').value) || 30;
    const questionsPerStudent = parseInt(document.getElementById('questionsPerStudent').value) || questions.length;

    const quizQuestions = [];
    const files = [];

    Array.from(questions).forEach((question, qIdx) => {
        const questionText = question.querySelector('textarea').value;
        const points = parseInt(question.querySelector('.points-field').value) || 1;
        // Question image
        let questionImage = '';
        const questionImgInput = question.querySelector('input[type="file"][id^="questionImg"]');
        if (questionImgInput) {
            if (questionImgInput.files && questionImgInput.files[0]) {
                questionImage = `question_${qIdx}_img_${questionImgInput.files[0].name}`;
                files.push({name: questionImage, file: questionImgInput.files[0]});
            } else if (questionImgInput.dataset.deleted === "1") {
                questionImage = null;
            } else if (questionImgInput.getAttribute('data-original')) {
                questionImage = questionImgInput.getAttribute('data-original');
            } else {
                questionImage = null;
            }
        }
        // Options
        const optionContents = question.querySelectorAll('.option-content');
        const correctAnswerValue = question.querySelector('.correct-answer').value;
        const options = Array.from(optionContents).map((optionContent, idx) => {
            const optionText = optionContent.querySelector('input[type="text"]').value;
            let optionImage = '';
            const optionImgInput = optionContent.querySelector('input[type="file"]');
            if (optionImgInput) {
                if (optionImgInput.files && optionImgInput.files[0]) {
                    optionImage = `question_${qIdx}_option_${idx}_img_${optionImgInput.files[0].name}`;
                    files.push({name: optionImage, file: optionImgInput.files[0]});
                } else if (optionImgInput.dataset.deleted === "1") {
                    optionImage = null;
                } else if (optionImgInput.getAttribute('data-original')) {
                    optionImage = optionImgInput.getAttribute('data-original');
                } else {
                    optionImage = null;
                }
            }
            return {
                option: optionText,
                option_image: optionImage,
                correct: (correctAnswerValue == (idx + 1).toString())
            };
        });
        quizQuestions.push({
            question: questionText,
            question_image: questionImage,
            points: points,
            options: options
        });
    });

    const quiz = {
        title: quizTitle,
        students: selectedStudents,
        time_limit: timeLimit,
        total_mark: parseInt(document.getElementById('totalMarks').value),
        questions_per_student: questionsPerStudent,
        questions: quizQuestions
    };

    // Build FormData for files + data
    const formData = new FormData();
    formData.append('quiz', JSON.stringify(quiz));
    formData.append('start_time', document.getElementById('quizStart').value);
    formData.append('end_time', document.getElementById('quizEnd').value);
    formData.append('assessment_id', window.ASSESSMENT_ID);

    // Append each image file
    files.forEach(({name, file}) => {
        formData.append('images', file, name);
    });

    // Confirm before sending
    console.log('Quiz JSON:', quiz);
    if (!await confirm("Are you sure to save quiz data?")) return;

    // Send using fetch
    fetch('/faculty/create_quiz/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.CSRF_TOKEN // CSRF token included
            // Do NOT set Content-Type manually; let browser handle it for FormData
        },
        body: formData
    })
    .then(response => response.json())
    .then(async data => {
        if (data.success) {
            await alert('Quiz created successfully');
            // Optionally redirect:
            window.location.href = `/faculty/course_management/${window.BATCH_INSTRUCTOR_ID}`;
        } else {
            console.error('Server error:', data);
            await alert('Failed to create quiz: ' + (data.message || data.error || 'Unknown error'));
        }
    })
    .catch(async (error) => {
        console.error('Error:', error);
        await alert('An error occurred while creating the quiz.');
    });
}

// Utility: fetch image as Blob and set as File in input
async function setFileInputFromUrl(input, url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) return;
        const blob = await response.blob();
        // Create a File object (File constructor may not be supported in all browsers, fallback to DataTransfer)
        let file;
        try {
            file = new File([blob], filename, { type: blob.type });
        } catch (e) {
            // Fallback for older browsers
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], filename, { type: blob.type }));
            file = dataTransfer.files[0];
        }
        // Set file to input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        // Trigger change event to update preview
        input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
        // Ignore if image not found
    }
}

async function fillQuizForm(quiz) {
    // Title
    console.log(quiz);
    if (document.getElementById('quizTitle')) {
        document.getElementById('quizTitle').value = quiz.title || '';
    }
    // Time limit
    document.getElementById('quizDuration').value = quiz.time_limit || 30;
    updateClockDisplay();
    // Questions per student
    document.getElementById('questionsPerStudent').value = quiz.questions_per_student || (quiz.questions ? quiz.questions.length : 1);
    // Start/end time
    if (quiz.start_time) document.getElementById('quizStart').value = quiz.start_time;
    if (quiz.end_time) document.getElementById('quizEnd').value = quiz.end_time;

    // Students
    selectedStudents = quiz.students || [];
    document.querySelectorAll('.student-card input[type="checkbox"]').forEach(checkbox => {
        const studentId = parseInt(checkbox.closest('.student-card').dataset.studentId);
        checkbox.checked = selectedStudents.includes(studentId);
        if (checkbox.checked) {
            checkbox.closest('.student-card').classList.add('selected');
        } else {
            checkbox.closest('.student-card').classList.remove('selected');
        }
    });
    updateSelectedStudentsDisplay();
    updateSelectAllCheckbox();

    // Questions
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    // For async image loading
    const imagePromises = [];

    (quiz.questions || []).forEach((q, qIdx) => {
        addQuestion();
        const questionDiv = questionsContainer.children[qIdx];
        // Question text
        questionDiv.querySelector('textarea').value = q.question || '';
        // Points
        questionDiv.querySelector('.points-field').value = q.points || 1;

        // Question image: set preview and input file if image exists
        if (q.question_image) {
            const imgUrl = `/media/quiz/${q.question_image}`;
            const previewContainer = questionDiv.querySelector('.image-preview');
            previewContainer.style.display = 'block';
            const previewImg = previewContainer.querySelector('.preview-img');
            previewImg.alt = q.question_image;
            previewImg.src = imgUrl;

            // Set file input from URL
            const questionImgInput = questionDiv.querySelector('input[type="file"][id^="questionImg"]');
            if (questionImgInput) {
                questionImgInput.setAttribute('data-original', q.question_image);
                imagePromises.push(setFileInputFromUrl(questionImgInput, imgUrl, q.question_image));
            }
        }

        // Remove default options, then add from data
        const optionsContainer = questionDiv.querySelector('.options-container');
        optionsContainer.innerHTML = '';
        const correctPreview = questionDiv.querySelector('.correct-options-preview');
        correctPreview.innerHTML = '';
        (q.options || []).forEach((opt, optIdx) => {
            // Add option
            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';
            optionContent.innerHTML = `
                <input type="text" placeholder="Option ${optIdx + 1}" required onchange="updateCorrectPreview(this)">
                <div class="option-actions">
                    <label for="optionImg${qIdx + 1}_${optIdx + 1}" class="file-upload-label">
                        <i class="fas fa-image"></i>
                    </label>
                    <input type="file" accept="image/*" id="optionImg${qIdx + 1}_${optIdx + 1}" onchange="previewOptionImage(this)" style="display: none;">
                    <button type="button" class="btn-danger remove-option" onclick="removeOption(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="option-image-preview" id="optionImagePreview${qIdx + 1}_${optIdx + 1}" style="display: none;">
                    <img src="" alt="Option Image Preview" class="preview-img">
                    <button type="button" class="btn-danger remove-image" onclick="removeOptionImage('${qIdx + 1}_${optIdx + 1}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            optionsContainer.appendChild(optionContent);
            // Fill option text
            optionContent.querySelector('input[type="text"]').value = opt.option || '';
            // Option image preview and input
            if (opt.option_image) {
                const imgUrl = `/media/quiz/${opt.option_image}`;
                const previewContainer = optionContent.querySelector('.option-image-preview');
                previewContainer.style.display = 'flex';
                const previewImg = previewContainer.querySelector('.preview-img');
                previewImg.alt = opt.option_image;
                previewImg.src = imgUrl;

                // Set file input from URL
                const optionImgInput = optionContent.querySelector('input[type="file"]');
                if (optionImgInput) {
                    optionImgInput.setAttribute('data-original', opt.option_image);
                    imagePromises.push(setFileInputFromUrl(optionImgInput, imgUrl, opt.option_image));
                }
            }
            // Add correct preview
            const optionLetter = String.fromCharCode(65 + optIdx);
            const previewOption = document.createElement('div');
            previewOption.className = 'preview-option';
            previewOption.dataset.value = (optIdx + 1);
            previewOption.setAttribute('onclick', `selectCorrectOption(this, ${qIdx + 1})`);
            previewOption.innerHTML = `
                <span class="option-label">${optionLetter}</span>
                <span class="option-text">${opt.option || ''}</span>
            `;
            correctPreview.appendChild(previewOption);
        });
        // Set correct answer
        const correctIdx = (q.options || []).findIndex(opt => opt.correct);
        if (correctIdx >= 0) {
            correctPreview.children[correctIdx].classList.add('selected');
            questionDiv.querySelector('.correct-answer').value = (correctIdx + 1).toString();
        }
    });
    updateMaxQuestions();

    // Wait for all images to be set before allowing form submission
    if (imagePromises.length > 0) {
        Promise.all(imagePromises).then(() => {
            // Optionally, you can enable the submit button here if you disabled it during loading
        });
    }
}

// --- Handle image deletion for questions/options ---

// Patch removeQuestionImage to clear file input and mark as deleted
function removeQuestionImage(questionNumber) {
    const fileInput = document.getElementById(`questionImg${questionNumber}`);
    const previewContainer = document.getElementById(`imagePreview${questionNumber}`);

    fileInput.value = '';
    previewContainer.style.display = 'none';

    // Mark as deleted for backend
    fileInput.dataset.deleted = "1";
}

// Patch removeOptionImage to clear file input and mark as deleted
function removeOptionImage(optionNumber) {
    const optionContent = document.querySelector(`#optionImagePreview${optionNumber}`).closest('.option-content');
    const previewContainer = optionContent.querySelector('.option-image-preview');
    const previewImg = previewContainer.querySelector('.preview-img');
    const fileInput = optionContent.querySelector('input[type="file"]');
    const questionNumber = optionContent.closest('.question').dataset.question;
    const optionIndex = Array.from(optionContent.parentElement.children).indexOf(optionContent) + 1;

    // Clear the file input
    fileInput.value = '';
    // Hide the preview
    previewContainer.style.display = 'none';
    previewImg.src = '';

    // Mark as deleted for backend
    fileInput.dataset.deleted = "1";

    // Update the correct answer preview
    const correctPreview = document.getElementById(`correctPreview${questionNumber}`);
    const previewOption = correctPreview.querySelector(`[data-value="${optionIndex}"]`);
    if (previewOption) {
        const optionImage = previewOption.querySelector('.option-image');
        if (optionImage) {
            optionImage.src = '';
        }
        previewOption.classList.remove('has-image');
    }
}

// --- Patch handleFormSubmission to handle image deletion ---

async function handleFormSubmission(event) {
    event.preventDefault();

    // Validate that students are selected
    if (selectedStudents.length === 0) {
        await alert('Please select at least one student for the quiz.');
        return;
    }

    // Validate that all questions have correct answers selected
    const questions = document.querySelectorAll('.question');
    let allValid = true;

    questions.forEach(async (question, index) => {
        const correctAnswer = question.querySelector('.correct-answer').value;
        if (!correctAnswer) {
            await alert(`Please select a correct answer for Question ${index + 1}.`);
            allValid = false;
            return;
        }
    });

    if (!allValid) return;

    // Build quiz JSON
    const quizTitle = document.getElementById('quizTitle') ? document.getElementById('quizTitle').value : '';
    const totalMark = document.getElementById('totalMarks').value;
    const timeLimit = parseInt(document.getElementById('quizDuration').value) || 30;
    const questionsPerStudent = parseInt(document.getElementById('questionsPerStudent').value) || questions.length;

    const quizQuestions = [];
    const files = [];

    Array.from(questions).forEach((question, qIdx) => {
        const questionText = question.querySelector('textarea').value;
        const points = parseInt(question.querySelector('.points-field').value) || 1;
        // Question image
        let questionImage = '';
        const questionImgInput = question.querySelector('input[type="file"][id^="questionImg"]');
        if (questionImgInput) {
            if (questionImgInput.files && questionImgInput.files[0]) {
                questionImage = `question_${qIdx}_img_${questionImgInput.files[0].name}`;
                files.push({name: questionImage, file: questionImgInput.files[0]});
            } else if (questionImgInput.dataset.deleted === "1") {
                questionImage = null;
            } else if (questionImgInput.getAttribute('data-original')) {
                questionImage = questionImgInput.getAttribute('data-original');
            } else {
                questionImage = null;
            }
        }
        // Options
        const optionContents = question.querySelectorAll('.option-content');
        const correctAnswerValue = question.querySelector('.correct-answer').value;
        const options = Array.from(optionContents).map((optionContent, idx) => {
            const optionText = optionContent.querySelector('input[type="text"]').value;
            let optionImage = '';
            const optionImgInput = optionContent.querySelector('input[type="file"]');
            if (optionImgInput) {
                if (optionImgInput.files && optionImgInput.files[0]) {
                    optionImage = `question_${qIdx}_option_${idx}_img_${optionImgInput.files[0].name}`;
                    files.push({name: optionImage, file: optionImgInput.files[0]});
                } else if (optionImgInput.dataset.deleted === "1") {
                    optionImage = null;
                } else if (optionImgInput.getAttribute('data-original')) {
                    optionImage = optionImgInput.getAttribute('data-original');
                } else {
                    optionImage = null;
                }
            }
            return {
                option: optionText,
                option_image: optionImage,
                correct: (correctAnswerValue == (idx + 1).toString())
            };
        });
        quizQuestions.push({
            question: questionText,
            question_image: questionImage,
            points: points,
            options: options
        });
    });

    const quiz = {
        title: quizTitle,
        total_mark: parseInt(totalMark),
        students: selectedStudents,
        time_limit: timeLimit,
        questions_per_student: questionsPerStudent,
        questions: quizQuestions
    };

    // Build FormData for files + data
    const formData = new FormData();
    formData.append('quiz', JSON.stringify(quiz));
    formData.append('start_time', document.getElementById('quizStart').value);
    formData.append('end_time', document.getElementById('quizEnd').value);
    formData.append('assessment_id', window.ASSESSMENT_ID);

    // Append each image file
    files.forEach(({name, file}) => {
        formData.append('images', file, name);
    });

    // Confirm before sending
    console.log('Quiz JSON:', quiz);
    if (!await confirm("Are you sure to save quiz data?")) return;

    // Send using fetch
    fetch('/faculty/create_quiz/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.CSRF_TOKEN // CSRF token included
            // Do NOT set Content-Type manually; let browser handle it for FormData
        },
        body: formData
    })
    .then(response => response.json())
    .then(async data => {
        if (data.success) {
            await alert('Quiz created successfully');
            // Optionally redirect:
            window.location.href = `/faculty/course_management/${window.BATCH_INSTRUCTOR_ID}`;
        } else {
            console.error('Server error:', data);
            await alert('Failed to create quiz: ' + (data.message || data.error || 'Unknown error'));
        }
    })
    .catch(async (error) => {
        console.error('Error:', error);
        await alert('An error occurred while creating the quiz.');
    });
}

// Patch fillQuizForm to set data-original for existing images
async function fillQuizForm(quiz) {
    // Title
    if (document.getElementById('quizTitle')) {
        document.getElementById('quizTitle').value = quiz.title || '';
    }
    // Time limit
    document.getElementById('quizDuration').value = quiz.time_limit || 30;
    updateClockDisplay();
    // Questions per student
    // await alert(quiz.questions_per_student);
    document.getElementById('questionsPerStudent').value = quiz.questions_per_student;
    // Start/end time
    if (quiz.start_time) document.getElementById('quizStart').value = quiz.start_time;
    if (quiz.end_time) document.getElementById('quizEnd').value = quiz.end_time;

    // Students
    selectedStudents = quiz.students || [];
    document.querySelectorAll('.student-card input[type="checkbox"]').forEach(checkbox => {
        const studentId = parseInt(checkbox.closest('.student-card').dataset.studentId);
        checkbox.checked = selectedStudents.includes(studentId);
        if (checkbox.checked) {
            checkbox.closest('.student-card').classList.add('selected');
        } else {
            checkbox.closest('.student-card').classList.remove('selected');
        }
    });
    updateSelectedStudentsDisplay();
    updateSelectAllCheckbox();

    // Questions
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    const imagePromises = [];

    (quiz.questions || []).forEach((q, qIdx) => {
        addQuestion();
        const questionDiv = questionsContainer.children[qIdx];
        questionDiv.querySelector('textarea').value = q.question || '';
        questionDiv.querySelector('.points-field').value = q.points || 1;

        // Question image
        if (q.question_image) {
            const imgUrl = `/media/quiz/${q.question_image}`;
            const previewContainer = questionDiv.querySelector('.image-preview');
            previewContainer.style.display = 'block';
            const previewImg = previewContainer.querySelector('.preview-img');
            previewImg.alt = q.question_image;
            previewImg.src = imgUrl;

            const questionImgInput = questionDiv.querySelector('input[type="file"][id^="questionImg"]');
            if (questionImgInput) {
                questionImgInput.setAttribute('data-original', q.question_image);
                imagePromises.push(setFileInputFromUrl(questionImgInput, imgUrl, q.question_image));
            }
        }

        const optionsContainer = questionDiv.querySelector('.options-container');
        optionsContainer.innerHTML = '';
        const correctPreview = questionDiv.querySelector('.correct-options-preview');
        correctPreview.innerHTML = '';
        (q.options || []).forEach((opt, optIdx) => {
            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';
            optionContent.innerHTML = `
                <input type="text" placeholder="Option ${optIdx + 1}" required onchange="updateCorrectPreview(this)">
                <div class="option-actions">
                    <label for="optionImg${qIdx + 1}_${optIdx + 1}" class="file-upload-label">
                        <i class="fas fa-image"></i>
                    </label>
                    <input type="file" accept="image/*" id="optionImg${qIdx + 1}_${optIdx + 1}" onchange="previewOptionImage(this)" style="display: none;">
                    <button type="button" class="btn-danger remove-option" onclick="removeOption(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="option-image-preview" id="optionImagePreview${qIdx + 1}_${optIdx + 1}" style="display: none;">
                    <img src="" alt="Option Image Preview" class="preview-img">
                    <button type="button" class="btn-danger remove-image" onclick="removeOptionImage('${qIdx + 1}_${optIdx + 1}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            optionsContainer.appendChild(optionContent);
            optionContent.querySelector('input[type="text"]').value = opt.option || '';
            if (opt.option_image) {
                const imgUrl = `/media/quiz/${opt.option_image}`;
                const previewContainer = optionContent.querySelector('.option-image-preview');
                previewContainer.style.display = 'flex';
                const previewImg = previewContainer.querySelector('.preview-img');
                previewImg.alt = opt.option_image;
                previewImg.src = imgUrl;

                const optionImgInput = optionContent.querySelector('input[type="file"]');
                if (optionImgInput) {
                    optionImgInput.setAttribute('data-original', opt.option_image);
                    imagePromises.push(setFileInputFromUrl(optionImgInput, imgUrl, opt.option_image));
                }
            }
            const optionLetter = String.fromCharCode(65 + optIdx);
            const previewOption = document.createElement('div');
            previewOption.className = 'preview-option';
            previewOption.dataset.value = (optIdx + 1);
            previewOption.setAttribute('onclick', `selectCorrectOption(this, ${qIdx + 1})`);
            previewOption.innerHTML = `
                <span class="option-label">${optionLetter}</span>
                <span class="option-text">${opt.option || ''}</span>
            `;
            correctPreview.appendChild(previewOption);
        });
        const correctIdx = (q.options || []).findIndex(opt => opt.correct);
        if (correctIdx >= 0) {
            correctPreview.children[correctIdx].classList.add('selected');
            questionDiv.querySelector('.correct-answer').value = (correctIdx + 1).toString();
        }
    });
    updateMaxQuestions();

    if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
    }
}
