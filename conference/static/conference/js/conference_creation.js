document.getElementById('scheduleMeeting').addEventListener('click', ()=> {
    document.getElementById('meetingModal').style.display = 'flex';
});

document.getElementById('cancelMeeting').addEventListener('click', ()=> {
    document.getElementById('meetingModal').style.display = 'none';
});

document.getElementById('meetingForm').addEventListener('submit', async (e)=> {
    e.preventDefault();
    const meetingName = document.getElementById('meetingName').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const batchInstructorId = window.batch_instructor.id;
    document.getElementById('meetingModal').style.display = 'none';

    if(await confirm(`Confirm scheduling "${meetingName}" from ${startTime} to ${endTime}?`)) {
        try {
            const response = await fetch('/conference/create_conference/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') // for Django
                },
                body: JSON.stringify({ meetingName, startTime, endTime, batchInstructorId})
            });

            if(response.ok) {
                await alert("Meeting scheduled successfully!");
                window.location.reload();
            } else {
                alert("Failed to schedule meeting.");
            }
        } catch (err) {
            console.error(err);
            alert("Error scheduling meeting.");
        }
    }
});

async function deleteVc(button) {
    const vcId = button.getAttribute("data-id");

    if (!await confirm("Are you sure you want to delete this conference?")) {
        return;
    }

    try {
        const response = await fetch(`/conference/delete/${vcId}/`, {
            method: "DELETE",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"), // CSRF for Django
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();
        if (result.success) {
            alert("Conference deleted successfully");
            // Optionally remove the card from UI
            button.closest(".item-card").remove();
        } else {
            alert("Error: " + result.error); 
        }
    } catch (error) {
        console.error("Error deleting conference:", error);
        alert("Something went wrong.");
    }
}

// Helper function for CSRF token (Django)
window.getCookie = function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.querySelectorAll(".join-btn").forEach(button => {
    button.addEventListener("click", async () => {
        const vcId = button.getAttribute("data-id");
        const confirmed = await confirm("Do you want to join this conference?");
        if (confirmed) {
            window.location.href = `/conference/meeting/${vcId}/`;
        }
    });
});