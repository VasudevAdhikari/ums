window.ajaxRequest = function sendAjaxRequest(formData, url) {
    console.log("got into send ajax request function");
    fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': clone.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json' // Optional: Set content type if sending JSON
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("successful");
                return data;
            } else {
                console.error(data.error + " error");
                return;
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

// await await alert(window.ajaxRequest);

function sendAjaxRequest(url, formData, callback) {
    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: formData
    })
    .then(response => response.json())
    .then(callback);
}

