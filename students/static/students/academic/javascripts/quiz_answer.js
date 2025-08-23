document.addEventListener('DOMContentLoaded', function() {
    const quiz = window.quiz_data;

    // Header info
    document.getElementById('quizTitle').textContent = quiz.title || 'Quiz';
    document.getElementById('scoreSummary').textContent = `Score: ${quiz.total_score} / ${quiz.questions.reduce((a, q) => a + (q.points || 1), 0)}`;
    document.getElementById('timeSummary').textContent = `Time taken: ${quiz.time_taken}`;
    document.getElementById('startTime').textContent = `Attempt started: ${quiz.attempt_time}`;
    document.getElementById('endTime').textContent = `Submitted: ${quiz.submit_time}`;
    document.getElementById('windowSwitchTimes').textContent = `No. of times you tried to switch window: ${quiz.window_switch_times}`;
    document.getElementById('copyTimes').textContent = `No. of times you tried to copy texts: ${quiz.copied_times}`;

    const container = document.getElementById('quizAnswersContainer');
    container.innerHTML = '';

    (quiz.questions || []).forEach((q, idx) => {
        const section = document.createElement('div');
        section.className = 'form-section question-result ' + (q.correct ? 'correct' : 'incorrect');

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
        (q.options || []).forEach(opt => {
            const label = document.createElement('label');
            label.className = 'option-with-image';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.disabled = true;
            radio.checked = !!opt.answered;

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

            // Mark correct/incorrect visually
            if (opt.answered && opt.correct) {
                optionContent.style.borderColor = '#22c55e';
                optionContent.style.background = 'rgba(34,197,94,0.08)';
            } else if (opt.answered && !opt.correct) {
                optionContent.style.borderColor = '#ef4444';
                optionContent.style.background = 'rgba(239,68,68,0.08)';
            } else if (opt.correct) {
                optionContent.style.borderColor = '#22c55e';
            }

            label.appendChild(radio);
            label.appendChild(optionContent);
            optionsDiv.appendChild(label);
        });
        section.appendChild(optionsDiv);

        // Feedback
        const feedback = document.createElement('div');
        feedback.className = 'answer-feedback';
        if (q.correct) {
            feedback.innerHTML = `<span class="correct-answer">Correct! +${q.got_points} point(s)</span>`;
        } else {
            feedback.innerHTML = `<span class="correct-answer">Incorrect. +0 point(s)</span>`;

            // Show correct answers
            const correctOptions = (q.options || []).filter(opt => opt.correct).map(opt => opt.option);
            if (correctOptions.length) {
                const rightAnswer = document.createElement('span');
                rightAnswer.className = 'correct-answer-text';
                rightAnswer.textContent = `Right Answer: ${correctOptions.join(', ')}`;
                feedback.appendChild(rightAnswer);
            }
        }
        section.appendChild(feedback);

        container.appendChild(section);
    });

    // Optional: print content when clicked
    container.onclick = () => print(container.textContent);
});
