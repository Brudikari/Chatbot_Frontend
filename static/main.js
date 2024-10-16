// Variable pour stocker la demande de l'utilisateur
let user_request = {
    message1: "", // Contient le message haineux
    message2: null // Contient l'entier de l'agent à utiliser
};

/**
 * Returns the current datetime for the message creation.
 */
function getCurrentTimestamp() {
    return new Date();
}

/**
 * Renders a message on the chat screen based on the given arguments.
 * This is called from the `showUserMessage` and `showBotMessage`.
 */
function renderMessageToScreen(args) {
    // local variables
    let displayDate = (args.time || getCurrentTimestamp()).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });
    let messagesContainer = $('.messages');

    // init element
    let message = $(`
        <li class="message ${args.message_side}">
            <div class="avatar"></div>
            <div class="text_wrapper">
                <div class="text">${args.text}</div>
                <div class="timestamp">${displayDate}</div>
            </div>
        </li>
    `);

    // add to parent
    messagesContainer.append(message);

    // animations
    setTimeout(function () {
        message.addClass('appeared');
    }, 0);
    messagesContainer.animate({ scrollTop: messagesContainer.prop('scrollHeight') }, 300);
}

/**
 * Displays the user message on the chat screen. This is the right side message.
 */
function showUserMessage(message) {
    renderMessageToScreen({
        text: message,
        message_side: 'right',
    });
}

/**
 * Displays the chatbot message on the chat screen. This is the left side message.
 */
function showBotMessage(message) {
    renderMessageToScreen({
        text: message,
        message_side: 'left',
    });
}

/**
 * Set initial bot message to the screen for the user.
 */
$(window).on('load', function () {
	showBotMessage(`Bonjour, je suis ChatBot'é, votre assistant contre le harcèlement en ligne.<br>Pour m'utiliser, copiez-collez le message de haine que vous avez reçu et suivez les instructions.`);
});

/**
 * Get input from user and show it on screen on button click.
 */
$('#send_button').on('click', function (e) {
    // Récupérer le message de l'utilisateur
    let userMessage = $('#msg_input').val();
    
    // Vérifier si le champ n'est pas vide
    if (userMessage.trim() !== '') {
        // Si c'est le premier message, on le stocke
        if (user_request.message1 === "") {
            user_request.message1 = userMessage; // Stocke le message haineux
            showUserMessage(userMessage);
            $('#msg_input').val(''); // Effacer l'input

            // Envoyer le message de confirmation du bot
            setTimeout(function () {
				showBotMessage(`J'ai bien noté votre message, quel type de conseil avez-vous besoin ?<br>Tapez 1 pour un conseil juridique.<br>Tapez 2 pour un soutien émotionnel.<br>Tapez 3 pour des conseils en cybersécurité.`);
            }, 300);
        } else {
            // Gérer le choix de l'utilisateur
            if (userMessage === '1' || userMessage === '2' || userMessage === '3') {
                user_request.message2 = parseInt(userMessage); // Stocke l'entier correspondant
                showUserMessage(userMessage); // Affiche le choix de l'utilisateur
                $('#msg_input').val(''); // Effacer l'input

                // Afficher la confirmation du choix
                setTimeout(function () {
                    showBotMessage(`Vous avez choisi l'option ${user_request.message2}.`);
                    // Désactiver l'input après le choix
                    $('#msg_input').prop('disabled', true);
                    $('#send_button').text("Reset conversation"); // Change le texte du bouton

                    // Appeler l'API avec les données de l'utilisateur
                    callAPI(user_request);
                }, 300);
            } else {
                // Afficher un message d'erreur si l'option n'est pas valide
                showBotMessage("Veuillez taper 1, 2 ou 3 pour choisir un type de conseil.");
            }
        }
    } else if ($('#send_button').text() === "Reset conversation") {
        // Si le bouton est "Reset conversation", réinitialiser la conversation
        resetConversation();
    }
});

// En option, gérer le cas où l'utilisateur appuie sur 'Entrée'
$('#msg_input').keydown(function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        $('#send_button').click();
    }
});

// Fonction pour réinitialiser la conversation
function resetConversation() {
    user_request.message1 = "";
    user_request.message2 = null;
    $('.messages').empty(); // Efface les messages affichés
    $('#msg_input').prop('disabled', false); // Réactive l'input
    $('#send_button').text("Send"); // Change le texte du bouton
    $('#send_button').prop('disabled', false); // Réactive le bouton
    showBotMessage(`Bonjour, je suis ChatBot'é, votre assistant contre le harcèlement en ligne. <br> Pour m'utiliser, copiez-collez le message de haine que vous avez reçu et suivez les instructions.`);
}

// Fonction pour réindenter le message
function formatMessage(message) {
    // Supprime les caractères ** et ajoute des sauts de ligne après chaque point et chaque numéro
    return message
        .replace(/\*\*(.*?)\*\*/g, '$1') // Supprime les ** autour du texte
        .replace(/(\d+\.\s)/g, '$1<br>') // Ajoute un <br> après chaque numéro de liste
        .replace(/(\.)\s+/g, '$1<br>'); // Ajoute un <br> après chaque point
}

// Fonction pour appeler l'API avec les données de l'utilisateur
function callAPI(userRequest) {
    fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
            message: userRequest.message1,
            agent: userRequest.message2
        })
    })
    .then(response => {
        // Vérifie si la réponse est correcte
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Retourne la réponse désérialisée
        return response.json();
    })
    .then(data => {
        // Afficher le message reçu de l'API
		console.log(data); // Pour le débogage, affiche l'ensemble des données
		// Formate le message reçu de l'API
		const formattedMessage = formatMessage(data.response);
		showBotMessage(formattedMessage); // Afficher le message formaté
    })
    .catch(error => {
        console.error('Il y a eu un problème avec l\'appel à l\'API :', error);
        showBotMessage("Désolé, une erreur s'est produite lors de la récupération des conseils.");
    });
}
