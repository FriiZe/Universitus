$(function () {
    "use strict";
    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var text = $('#text');
    var input = $('#input');
    var terminal = $('#terminal');
    var textarea = $('#textarea');

    var buttonSave = $("input[name='buttonSave']");
    var buttonExit = $("input[name='buttonExit']");

    var taTitle = $('#textareaTitle');
    var taText = $('#textareaText');

    var hist = [];
    var editmode = false;
    var editcatch = false;
    var editerrors = [
        "Vous ne pouvez pas modifier cet objet.",
        "L'objet que vous tentez de modifier est invalide."
    ];
    var editorExitMsg = "";

    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show
    // some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t support this application.'
        }));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://universitus.rhythmgamers.net:1337');
    //var connection = new WebSocket('ws://127.0.0.1:1337');



    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
    };

    connection.onerror = function (error) {
        // just in there were some problems with connection...
        text.html($('<p>', {
            text: 'Sorry, but there\'s a problem with your ' +
                'connection or the server is down.'
        }));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server
        // always returns JSON this should work without any problem but
        // we should make sure that the massage is not chunked or
        // otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('Invalid JSON: ', message.data);
            return;
        }
        
        if (json.type === 'message') {
            if(editmode || editcatch) {
                if(editcatch) {
                    var parts = json.data.text.split("\\n");
                    addMessage(json.data.author, parts[parts.length-2]+"\\n");
                    addMessage(json.data.author, parts[parts.length-1]);
                    editcatch = false;
                    input.focus();
                    return;
                }
                // This message is to add to the contents of our editor's textarea

                var parts = json.data.text.split("\\n");
                // Add the normal message to the console (the command typed by the user)
                var command = parts.shift();
                console.log("message: "+command)

                var parts2 = parts.join("").split("\\eof");

                if(parts2.length > 1) {
                    addMessage(json.data.author, command+"\\n");
                    var text = parts2.shift();
                    var rest = parts2.join("\\eof");
    
                    if(editerrors.includes(text)) {
                        addMessage(json.data.author, text);
                        input.focus();
                    } else {
                        editorExitMsg = rest;
                        showEditor(command.split(" ")[1],text);
                        input.focus();
                    }
                } else {
                    addMessage(json.data.author, json.data.text);
                }
            } else {
                // Refocus as a new message arrives
                input.focus();
                if (json.data.password) {
                    input.prop('type', 'password');
                } else {
                    input.prop('type', 'input');
                }
                addMessage(json.data.author, json.data.text, new Date(json.data.time));
            }
        } else {
            console.log('JSON encoding error:', json);
        }
    };

    var hist_index = -1;
    /**
     * Send message when user presses Enter key
     */
    input.keydown(function (e) {
        if (e.keyCode === 13) {
            // Enter
            var msg = $(this).val();
            if (!msg) {
                return;
            }

            // send the message as an ordinary text
            checkMessage(msg);
            connection.send(msg + "\n");
            // handle sent history
            if($(this).attr('type') != "password") {
                hist.unshift(msg);
            }
            hist_index = -1;
            $(this).val('');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
        if (e.keyCode === 38) {
            // Up
            if(hist_index+1<hist.length) {
                hist_index++;
            }
            $(this).val(hist[hist_index]);
        }
        if (e.keyCode === 40) {
            // Down
            if(hist_index>-1) {
                hist_index--;
            }
            if(hist_index>-1) {
                $(this).val(hist[hist_index]);
            } else {
                $(this).val('');
            }
        }
        var l = this.value.length > 5 ? this.value.length : 5;
        this.style.width = l + "ch";
    });

    /**
     * This method is optional. If the server wasn't able to
     * respond to the in 3 seconds then show some error message 
     * to notify the user that something is wrong.
     */
    setInterval(function () {
        if (connection.readyState !== 1) {
            input.attr('disabled', 'disabled').val(
                'Unable to communicate with the WebSocket server.');
        }
    }, 3000);
    
    /**
     * Force the user to stay on the terminal
     */
    setInterval(function () {
        if(!editmode) {
            input.focus();
        }
    }, 1000);

    /**
     * Check if message starts with edit:
     * Transition from terminal style window to a textarea
     */
    function checkMessage(message) {
        var pars = message.split(" ");
        // If the command is Edit, set editmode to true
        if (pars[0] == "edit") {
            console.log("edit active");
            editmode = true;
        }
    }


    /**
     *  Enables the editor window
     */
    function showEditor(title, contents) {
        terminal.attr('style', 'display: none');
        textarea.attr('style', 'display: block');
        taTitle.val(title);
        editor.setValue(contents,-1);
    }

    /**
     * Save button of the Edit Textarea
     */
    buttonSave.click(function () {
        var text = 'edit_ "' + editor.getValue().replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r") + '" > ' + taTitle.val();
        connection.send(text);
        console.log(text);

        terminal.attr('style', 'display: block');
        textarea.attr('style', 'display: none');
        taTitle.val('');
        editor.setValue('',-1);
        editmode = false;
        editcatch = true;
    });

    /**
     * Exit button of the Edit Textarea
     */
    buttonExit.click(function () {
        terminal.attr('style', 'display: block');
        textarea.attr('style', 'display: none');
        taTitle.val('');
        taText.val('');
        addMessage("",editorExitMsg);
        editmode = false;
    });

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt, raw = false) {
        if(raw) {
            text.append(message.replace(/(\\n)/g, '<br>'));
            return;
        }

        var ansi_up = new AnsiUp;
        var html = ansi_up.ansi_to_html(message);

        text.append(html.replace(/(\\n)/g, '<br>'));
    }
    function resizeInput() {
        this.style.width = this.value.length + "ch";
      }
    input.on('input', resizeInput);
});
