//$(function() {
//  // Get a reference to the root of the chat data.
//  var messagesRef = new Firebase("https://torid-inferno-4435.firebaseio.com/chat");
//
//  // When the user presses enter on the message input, write the message to firebase.
//  $("#messageInput").keypress(function (e) {
//    if (e.keyCode == 13) {
//      var name = $("#nameInput").val();
//      var text = $("#messageInput").val();
//      messagesRef.push({name:name, text:text});
//      $("#messageInput").val("");
//    }
//  });
//
//  // Add a callback that is triggered for each chat message.
//  messagesRef.limitToLast(10).on("child_added", function (snapshot) {
//    var message = snapshot.val();
//    $("<div/>").text(message.text).prepend($("<em/>")
//      .text(message.name + ": ")).appendTo($("#messagesDiv"));
//    $("#messagesDiv")[0].scrollTop = $("#messagesDiv")[0].scrollHeight;
//  });
//});
//

var provider = 'google';

function runExample(demoUrl) {
    "use strict";
    
    var uid = null, room = null, submitted = false, sub = null, members = {}, userName;
    var ref = new Firebase(demoUrl);
    var $join = $('#joinForm');
    
    // handle input and form events
    $('#chatForm').submit(processForm);
    // $inp.on('keyup', _.debounce(countChars, 50));
    $('#google-login').click(function (e) {
        provider = 'google';
        authenticate(e)
    });
    $('#github-login').click(function (e) {
        provider = 'github';
        authenticate(e)
    });
    $('a[href="#logout"]').click(logout);
    $('a[href="#leave"]').click(leaveRoom);
    $join.submit(joinRoom);
    
    console.log('Test');
    function authenticate(e) {
        console.log('Authenticate');
        e.preventDefault();
        ref.authWithOAuthPopup(provider, function(err, user) {
            if (err) {
                console.log(err, 'error');
            } else if (user) {
                // logged in!
                uid = user.uid;
                console.log('logged in with id', uid);
                $('#login-layer').hide();
                ref.child('room_names').once('value', buildRoomList);
            } else {
                // logged out
                $('#login-layer').show();
            }
        });
    }
    
    function logout(e) {
       e.preventDefault();
       ref.unauth();
    }

    // create option tags in our room select
    function buildRoomList(snap) {
        var $sel = $('select').empty();
        snap.forEach(function (ss) {
            $('<option />')
                .prop('value', ss.name())
                .text(ss.val())
                .appendTo($sel);
        });
        pickRoom();
        $sel.change(pickRoom);
    }

    // when the select is updated, load that room's messages
    function pickRoom() {
        roomOff();
        $('#chatForm').hide();
        var roomId = $('select').val();
        
        // see if we need to join or if we are already a member
        // by trying to load the list of members
        getMembers(roomId).then(loadRoom, showJoinForm);
    }
    
    function getMembers(roomId) {
        return $.Deferred(function(def) {
           // try to read the room's members, if we succeed
           // then we are a member
           ref.child('members').child(roomId)
           .once('value', function(snap) {
               members = snap.val() || {};
               if( !members.hasOwnProperty(uid) ) {
                  def.reject();
               }
               else {
                  setName(members[uid]);
                  def.resolve();   
               }
           }, def.reject);
        });
    }
    
    function showJoinForm() {
        console.log('showJoinForm');
       var $ul = emptyRoom();
       $('<li>You are not a member of this room</li>').appendTo($ul);
       var $li = $('<li />').append($join.show()).appendTo($ul);
    }
    
    function joinRoom(e) {
       e.preventDefault();
       var roomId = $('select').val();
       var name = $(this).find('input').val();
        if( name ) {
            setName(name);
            ref.child('members').child(roomId).child(uid).set(name, function(err) {
                if( err ) { log(err, 'error'); }
                else {
                   getMembers(roomId).then(loadRoom, result);   
                }
            });
        }
        else {
           log('Enter a name', 'error');   
        }
    }
    
    function leaveRoom(e) {
       e.preventDefault();
       roomOff();
       var roomId = $('select').val();
       ref.child('members').child(roomId).child(uid).remove(pickRoom);
    }
    
    function roomOff() {
       if( room ) { 
            // stop listening to the previous room
            room.off('child_added', newMessage);
            room.off('child_removed', dropMessage);
        }   
    }
    
    function loadRoom() {
        emptyRoom();
        $('#chatForm').show();
        room = ref.child('messages').child($('select').val()).limit(100);   
        room.on('child_added', newMessage);
        room.on('child_removed', dropMessage);   
    }
    
    function emptyRoom() {
        $join.detach();
        return $('ul.chatbox').empty();
    }
    
    function setName(name) {
       userName = name;
       members[name] = name;
       $('#chatForm').find('button').text('Send as '+name);
    }
    
    // create a new message in the DOM after it comes
    // in from the server (via child_added)
    function newMessage(snap) {
        var $chat = $('ul.chatbox');
        var data = snap.val();
        // var txt = members[dat.user] + ': ' + dat.message;
        var txt = data.date || '';
        txt += " | "
        txt += data.amount || '';
        txt += " | "
        txt += data.description || '';
        txt += " | "
        txt += data.purchaser || '';
        txt += " | "
        txt += data.cartland || '';
        txt += " | "
        txt += data.npstanford || '';
        txt += " | "
        txt += data.rcrabb || '';
        txt += " | "
        txt += data.stromme || '';
        txt += " | "
        txt += data.notes || '';
        $('<li />').attr('data-id', snap.name()).text(txt).appendTo($chat); 
        $chat.scrollTop($chat.height());
    }
    
    // remove message locally after child_removed
    function dropMessage(snap) {
        $('li[data-id="'+snap.name()+'"]').remove();
    }

    // print results of write attempt so we can see if
    // rules allowed or denied the attempt
    function result(err) {
        if (err) {
            log(err.code, 'error');
        } else {
            log('success!');
        }
    }

    // post the forms contents and attempt to write a message
    function processForm(e) {
        e.preventDefault();
        submitted = true;
        if (!userName) {
            log('No username :(', 'error');
        } else {
            room.ref().push({
                user: uid,
                message: $('input[name=data]').val(),
                date: $('input[name=date]').val(),
                amount: $('input[name=amount]').val(),
                description: $('input[name=description]').val(),
                purchaser: $('input[name=purchaser]').val(),
                cartland: $('input[name=cartland]').val(),
                npstanford: $('input[name=npstanford]').val(),
                rcrabb: $('input[name=rcrabb]').val(),
                stromme: $('input[name=stromme]').val(),
                notes: $('input[name=notes]').val(),
                timestamp: Firebase.ServerValue.TIMESTAMP
            }, result);
        }
    }
        
    // tell user how many characters they have entered
    function countChars() {
        var len = $(this).val().length;
        if( len || !submitted ) {
            var style = len >= 50 ? 'error' : 'note';
            log(len + ' characters', style);
        }
        return true;
    }

    // print write results
    function log(text, style) {
        delayedClear();
        var $p = $('p.result').removeClass('error note success');
        style && $p.addClass(style);
        $p.text(text);
    }

    var to;

    // clear write results after 5 seconds
    function delayedClear() {
        to && clearTimeout(to);
        to = setTimeout(clearNow, 5000);
    }

    // clear write results now
    function clearNow() {
        $('p.result').text('');
        to && clearTimeout(to);
        to = null;
        submitted = false;
    }

}


// Dependencies used in this fiddle:
// code.jquery.com/jquery-2.1.0.min.js
// cdn.firebase.com/js/client/2.0.4/firebase.js
// cdn-gh.firebase.com/demo-utils-script/demo-utils.js
// cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min.js
//
// This line creates a unique, private Firebase URL 
// you can hack in! Have fun!
// $.loadSandbox('web/usec/example', 'web/usec/example').then(runExample);                                                                      
$(document).ready(function () {
    runExample("https://torid-inferno-4435.firebaseio.com");
});


