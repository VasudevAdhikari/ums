let starCount = 0;
function sendAjaxRequest(url, data) {
fetch(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.csrf_token, // important for Django
    },
    body: JSON.stringify(data),
})
.then((response) => response.json()) // parse JSON response
.then(async (result) => {
    console.log("Success:", result);
    if (result.success) {
        await alert(result.message);
        window.location.reload();
    }
})
.catch((error) => {
    console.error("Error:", error);
});
}


document.getElementById('reviewBtn').onclick = function () {
    document.getElementById('reviewPopup').style.display = 'flex';
};
document.getElementById('cancelReviewBtn').onclick = function () {
    document.getElementById('reviewPopup').style.display = 'none';
    document.getElementById('reviewText').value = '';
};
document.getElementById('submitReviewBtn').onclick = async function () {
    var review = document.getElementById('reviewText').value.trim();
    if (!review) {
        await alert('Please enter your review.');
        return;
    }
    let check = await confirm('Are you sure you want to submit this review?');
    if (!check) {
        return;
    }
    const data = {
        review: review
    };
    sendAjaxRequest(`/students/academics/enrollment_course_review/${window.batch_instructor.id}/`, review)
};

// Rating popup logic
document.getElementById('rateBtn').onclick = function () {
    document.getElementById('ratingPopup').style.display = 'flex';
    setStars(0); // Reset stars
};
document.getElementById('cancelRatingBtn').onclick = function () {
    document.getElementById('ratingPopup').style.display = 'none';
    setStars(0);
};

let selectedRating = 0;
function setStars(rating) {
    starCount = rating;
    var stars = document.querySelectorAll('#starContainer .star');
    stars.forEach(function (star, idx) {
        if (idx < rating) {
            star.style.color = '#ffd700';
        } else {
            star.style.color = '#bfc6e0';
        }
    });
}

document.querySelectorAll('#starContainer .star').forEach(function (star) {
    star.onclick = function () {
        var val = parseInt(star.getAttribute('data-value'));
        selectedRating = val;
        setStars(val);
    };
    star.onmouseover = function () {
        setStars(parseInt(star.getAttribute('data-value')));
    };
    star.onmouseout = function () {
        setStars(selectedRating);
    };
});
document.getElementById('submitRatingBtn').onclick = async function () {
    if (selectedRating === 0) {
        await alert('Please select a rating by clicking the stars.');
        return;
    }
    let check = await confirm('Are you sure you want to submit this rating?');
    if (!check) {
        return;
    }
    sendAjaxRequest(
        `/students/academics/enrollment_course_rating/${window.batch_instructor.id}/`,
        starCount
    )
};