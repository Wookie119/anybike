/*
AnyBike
File: live-chat.js
Version: 2026.09.01-2

Standalone anonymous Live Chat.

- Secure guest token
- Detects Admin-started chat
- Shows invitation
- Opens conversation panel
- Loads messages
- Sends guest replies
- Polls for new messages
- Detects when Admin ends chat
*/

(function initialiseAnyBikeLiveChat(){

  const GUEST_CHAT_URL =
    "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/guest-live-chat";

  const VISITOR_KEY = "anybike_visitor_id";
  const TOKEN_KEY = "anybike_guest_chat_token";

  const STATUS_POLL_MS = 5000;
  const MESSAGE_POLL_MS = 3000;

  let statusTimer = null;
  let messageTimer = null;

  let requestRunning = false;
  let messageRequestRunning = false;

  let currentThreadId = null;
  let currentLiveStatus = false;
  let panelOpen = false;
  let dismissedThreadId = null;

  let lastMessageSignature = "";


  /* =========================================================
     STORAGE
     ========================================================= */

  function getVisitorId(){
    try{
      return localStorage.getItem(VISITOR_KEY) || "";
    }catch(error){
      return "";
    }
  }


  function getGuestToken(){
    try{
      return localStorage.getItem(TOKEN_KEY) || "";
    }catch(error){
      return "";
    }
  }


  function saveGuestToken(token){
    if(!token) return;

    try{
      localStorage.setItem(TOKEN_KEY,token);
    }catch(error){
      console.warn(
        "AnyBike Live Chat token could not be stored",
        error
      );
    }
  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHtml(value){

    return String(value ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }


  function formatTime(value){

    if(!value){
      return "";
    }

    try{

      return new Date(value).toLocaleString(
        "en-GB",
        {
          day:"2-digit",
          month:"short",
          hour:"2-digit",
          minute:"2-digit"
        }
      );

    }catch(error){

      return "";

    }
  }


  /* =========================================================
     API
     ========================================================= */

  async function callGuestChat(payload){

    const response = await fetch(
      GUEST_CHAT_URL,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(payload)
      }
    );

    let data = {};

    try{
      data = await response.json();
    }catch(error){
      data = {};
    }

    if(!response.ok){

      throw new Error(
        data?.error ||
        "Live Chat request failed"
      );

    }

    return data;
  }


  async function initialiseGuest(){

    const visitorId = getVisitorId();

    if(!visitorId){
      return false;
    }

    const existingToken = getGuestToken();

    const payload = {
      action:"init",
      visitor_id:visitorId
    };

    if(existingToken){
      payload.guest_token = existingToken;
    }

    const data =
      await callGuestChat(payload);

    if(data?.guest_token){
      saveGuestToken(data.guest_token);
    }

    return Boolean(
      getGuestToken() ||
      data?.guest_token
    );
  }


  async function getChatStatus(){

    const visitorId = getVisitorId();
    const guestToken = getGuestToken();

    if(!visitorId || !guestToken){
      return null;
    }

    return await callGuestChat({
      action:"status",
      visitor_id:visitorId,
      guest_token:guestToken
    });
  }


  async function getMessages(){

    const visitorId = getVisitorId();
    const guestToken = getGuestToken();

    if(
      !visitorId ||
      !guestToken ||
      !currentThreadId
    ){
      return [];
    }

    const data =
      await callGuestChat({
        action:"messages",
        visitor_id:visitorId,
        guest_token:guestToken,
        thread_id:currentThreadId
      });

    if(Array.isArray(data?.messages)){
      return data.messages;
    }

    if(Array.isArray(data?.data)){
      return data.data;
    }

    return [];
  }


  async function sendMessage(message){

    const visitorId = getVisitorId();
    const guestToken = getGuestToken();

    if(
      !visitorId ||
      !guestToken ||
      !currentThreadId
    ){
      throw new Error(
        "Live Chat is not connected."
      );
    }

    return await callGuestChat({
      action:"send",
      visitor_id:visitorId,
      guest_token:guestToken,
      thread_id:currentThreadId,
      message:message
    });
  }


  /* =========================================================
     STYLES
     ========================================================= */

  function injectStyles(){

    if(
      document.getElementById(
        "anybike-live-chat-styles"
      )
    ){
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "anybike-live-chat-styles";

    style.textContent = `

      #anybike-live-chat-invite,
      #anybike-live-chat-panel{
        font-family:
          Arial,
          Helvetica,
          sans-serif;
        box-sizing:border-box;
      }


      /* INVITATION */

      #anybike-live-chat-invite{
        position:fixed;
        right:22px;
        bottom:22px;

        width:min(
          360px,
          calc(100vw - 32px)
        );

        z-index:2147483000;

        display:flex;
        gap:13px;

        padding:18px 18px 17px;

        background:#101010;
        color:#fff;

        border:
          1px solid
          rgba(255,255,255,.13);

        border-radius:16px;

        box-shadow:
          0 18px 55px
          rgba(0,0,0,.48);
      }

      #anybike-live-chat-invite
      .ab-chat-close{

        position:absolute;
        top:7px;
        right:10px;

        width:28px;
        height:28px;

        padding:0;
        border:0;

        background:transparent;
        color:#aaa;

        font-size:23px;
        cursor:pointer;
      }

      .ab-chat-invite-icon{

        flex:0 0 42px;

        width:42px;
        height:42px;

        display:flex;
        align-items:center;
        justify-content:center;

        background:#ed1c24;
        border-radius:50%;

        font-size:21px;
      }

      .ab-chat-invite-copy{
        flex:1;
        min-width:0;
        padding-right:10px;
      }

      .ab-chat-invite-copy strong{
        display:block;

        margin:1px 0 6px;

        color:#fff;
        font-size:16px;
      }

      .ab-chat-invite-copy p{

        margin:0 0 13px;

        color:#d5d5d5;

        font-size:13px;
        line-height:1.45;
      }

      .ab-chat-red-button{

        display:inline-flex;
        align-items:center;
        justify-content:center;

        min-height:38px;

        padding:9px 16px;

        border:0;
        border-radius:9px;

        background:#ed1c24;
        color:#fff;

        font-weight:700;
        font-size:13px;

        cursor:pointer;
      }


      /* CHAT PANEL */

      #anybike-live-chat-panel{

        position:fixed;
        right:22px;
        bottom:22px;

        width:380px;
        max-width:
          calc(100vw - 32px);

        height:560px;
        max-height:
          calc(100vh - 40px);

        z-index:2147483001;

        display:flex;
        flex-direction:column;

        overflow:hidden;

        background:#111;
        color:#fff;

        border:
          1px solid
          rgba(255,255,255,.14);

        border-radius:18px;

        box-shadow:
          0 20px 65px
          rgba(0,0,0,.55);
      }


      .ab-chat-header{

        flex:0 0 auto;

        display:flex;
        align-items:center;
        gap:11px;

        padding:14px 15px;

        background:#090909;

        border-bottom:
          1px solid
          rgba(255,255,255,.10);
      }


      .ab-chat-header-icon{

        width:39px;
        height:39px;

        display:flex;
        align-items:center;
        justify-content:center;

        border-radius:50%;

        background:#ed1c24;

        font-size:19px;
      }


      .ab-chat-header-copy{
        flex:1;
        min-width:0;
      }


      .ab-chat-header-copy strong{
        display:block;
        font-size:15px;
      }


      .ab-chat-header-copy span{

        display:block;

        margin-top:3px;

        color:#9f9f9f;
        font-size:12px;
      }


      .ab-chat-header-close{

        width:34px;
        height:34px;

        border:0;
        border-radius:8px;

        background:#191919;
        color:#bbb;

        font-size:22px;

        cursor:pointer;
      }


      .ab-chat-messages{

        flex:1;

        display:flex;
        flex-direction:column;
        gap:10px;

        overflow-y:auto;

        padding:15px;

        scrollbar-width:none;
        -ms-overflow-style:none;
      }

      .ab-chat-messages::-webkit-scrollbar{
        display:none;
      }


      .ab-chat-loading,
      .ab-chat-empty{

        margin:auto;

        color:#999;

        font-size:13px;
        text-align:center;
      }


      .ab-chat-message{

        max-width:82%;

        padding:10px 12px;

        border-radius:13px;

        font-size:13px;
        line-height:1.45;
      }


      .ab-chat-message.anybike{

        align-self:flex-start;

        background:#222;

        border-bottom-left-radius:4px;
      }


      .ab-chat-message.customer{

        align-self:flex-end;

        background:#ed1c24;

        border-bottom-right-radius:4px;
      }


      .ab-chat-message-name{

        margin-bottom:4px;

        font-size:11px;
        font-weight:700;

        opacity:.78;
      }


      .ab-chat-message-time{

        margin-top:5px;

        font-size:10px;

        opacity:.63;
      }


      .ab-chat-ended{
  flex:0 0 auto;
  padding:18px 16px;

  background:#181818;

  border-top:
    1px solid
    rgba(255,255,255,.10);

  color:#ddd;

  font-size:15px;
  line-height:1.5;
}

.ab-chat-ended-title{
  margin-bottom:8px;

  color:#fff;

  font-size:18px;
  line-height:1.3;
  font-weight:700;
}

.ab-chat-ended-copy{
  margin-bottom:16px;

  color:#ddd;

  font-size:15px;
  line-height:1.5;
}

.ab-chat-ended-primary{
  display:flex;
  align-items:center;
  justify-content:center;

  width:100%;
  box-sizing:border-box;

  min-height:46px;
  padding:11px 16px;

  border-radius:9px;

  background:#ed1c24;
  color:#fff;

  font-size:15px;
  font-weight:700;
  text-decoration:none;
}

.ab-chat-ended-secondary{
  display:block;

  margin-top:13px;

  color:#ddd;

  font-size:14px;
  line-height:1.4;
  text-align:center;
  text-decoration:none;
}

.ab-chat-ended-secondary:hover{
  color:#fff;
}

    document.head.appendChild(style);
  }


  /* =========================================================
     INVITATION
     ========================================================= */

  function removeInvitation(){

    document
      .getElementById(
        "anybike-live-chat-invite"
      )
      ?.remove();
  }


  function showInvitation(threadId){

    if(panelOpen){
      return;
    }

    if(
      dismissedThreadId === threadId
    ){
      return;
    }

    if(
      document.getElementById(
        "anybike-live-chat-invite"
      )
    ){
      return;
    }

    injectStyles();

    const box =
      document.createElement("div");

    box.id =
      "anybike-live-chat-invite";

    box.innerHTML = `

      <button
        type="button"
        class="ab-chat-close"
        aria-label="Close Live Chat invitation"
      >
        ×
      </button>

      <div class="ab-chat-invite-icon">
        💬
      </div>

      <div class="ab-chat-invite-copy">

        <strong>
          AnyBike Live Chat
        </strong>

        <p>
          AnyBike is available to chat
          with you. Would you like to
          open the conversation?
        </p>

        <button
          type="button"
          class="ab-chat-red-button"
        >
          Open Live Chat
        </button>

      </div>
    `;

    document.body.appendChild(box);


    box
      .querySelector(
        ".ab-chat-close"
      )
      ?.addEventListener(
        "click",
        function(){

          dismissedThreadId =
            threadId;

          removeInvitation();
        }
      );


    box
      .querySelector(
        ".ab-chat-red-button"
      )
      ?.addEventListener(
        "click",
        function(){

          openChatPanel();

        }
      );
  }


  /* =========================================================
     CHAT PANEL
     ========================================================= */

  function openChatPanel(){

    removeInvitation();

    if(
      document.getElementById(
        "anybike-live-chat-panel"
      )
    ){
      return;
    }

    panelOpen = true;

    injectStyles();

    const panel =
      document.createElement("div");

    panel.id =
      "anybike-live-chat-panel";

    panel.innerHTML = `

      <div class="ab-chat-header">

        <div class="ab-chat-header-icon">
          💬
        </div>

        <div class="ab-chat-header-copy">

          <strong>
            AnyBike Live Chat
          </strong>

          <span id="ab-chat-status">
            Live conversation
          </span>

        </div>

        <button
          type="button"
          class="ab-chat-header-close"
          aria-label="Close Live Chat"
        >
          ×
        </button>

      </div>


      <div
        class="ab-chat-messages"
        id="ab-chat-messages"
      >
        <div class="ab-chat-loading">
          Loading conversation...
        </div>
      </div>


      <div
        id="ab-chat-ended"
        style="display:none"
        class="ab-chat-ended"
      >
      </div>


      <div
        class="ab-chat-reply"
        id="ab-chat-reply"
      >

        <textarea
          id="ab-chat-text"
          maxlength="2000"
          placeholder="Type your message..."
        ></textarea>

        <button
          type="button"
          class="ab-chat-send"
          id="ab-chat-send"
        >
          Send
        </button>

      </div>

    `;

    document.body.appendChild(panel);


    panel
      .querySelector(
        ".ab-chat-header-close"
      )
      ?.addEventListener(
        "click",
        closeChatPanel
      );


    document
      .getElementById(
        "ab-chat-send"
      )
      ?.addEventListener(
        "click",
        submitGuestMessage
      );


    document
      .getElementById(
        "ab-chat-text"
      )
      ?.addEventListener(
        "keydown",
        function(event){

          if(
            event.key === "Enter" &&
            !event.shiftKey
          ){

            event.preventDefault();

            submitGuestMessage();

          }

        }
      );


    refreshMessages(true);

    startMessagePolling();
  }


  function closeChatPanel(){

    panelOpen = false;

    document
      .getElementById(
        "anybike-live-chat-panel"
      )
      ?.remove();

    stopMessagePolling();


    if(
      currentThreadId &&
      currentLiveStatus
    ){

      dismissedThreadId = null;

      showInvitation(
        currentThreadId
      );

    }
  }


  /* =========================================================
     MESSAGES
     ========================================================= */

  function renderMessages(
    messages,
    forceScroll
  ){

    const box =
      document.getElementById(
        "ab-chat-messages"
      );

    if(!box){
      return;
    }

    const rows =
      Array.isArray(messages)
        ? messages
        : [];


    if(!rows.length){

      box.innerHTML = `
        <div class="ab-chat-empty">
          Live Chat is connected.<br>
          Send a message to AnyBike.
        </div>
      `;

      return;
    }


    const signature =
      rows.map(function(row){

        return [
          row.id,
          row.created_at,
          row.message
        ].join("|");

      }).join("::");


    if(
      signature ===
      lastMessageSignature
    ){
      return;
    }

    lastMessageSignature =
      signature;


    const wasNearBottom =
      (
        box.scrollHeight -
        box.scrollTop -
        box.clientHeight
      ) < 90;


    box.innerHTML =
      rows.map(function(row){

        const senderType =
          String(
            row.sender_type ||
            row.sender ||
            ""
          ).toLowerCase();

        const customerMessage =
          senderType.includes(
            "customer"
          ) ||
          senderType.includes(
            "guest"
          );

        const cssClass =
          customerMessage
            ? "customer"
            : "anybike";

        const senderName =
          customerMessage
            ? "You"
            : (
                row.sender_name ||
                "AnyBike"
              );

        return `

          <div
            class="ab-chat-message ${cssClass}"
          >

            <div
              class="ab-chat-message-name"
            >
              ${escapeHtml(senderName)}
            </div>

            <div>
              ${escapeHtml(
                row.message || ""
              ).replace(/\n/g,"<br>")}
            </div>

            <div
              class="ab-chat-message-time"
            >
              ${escapeHtml(
                formatTime(
                  row.created_at
                )
              )}
            </div>

          </div>

        `;

      }).join("");


    if(
      forceScroll ||
      wasNearBottom
    ){

      box.scrollTop =
        box.scrollHeight;

    }
  }


  async function refreshMessages(
    forceScroll
  ){

    if(
      !panelOpen ||
      messageRequestRunning
    ){
      return;
    }

    messageRequestRunning = true;

    try{

      const messages =
        await getMessages();

      renderMessages(
        messages,
        Boolean(forceScroll)
      );

    }catch(error){

      console.warn(
        "AnyBike Live Chat messages unavailable",
        error.message || error
      );

    }finally{

      messageRequestRunning = false;

    }
  }


  async function submitGuestMessage(){

    if(!currentLiveStatus){
      return;
    }

    const textarea =
      document.getElementById(
        "ab-chat-text"
      );

    const button =
      document.getElementById(
        "ab-chat-send"
      );

    if(!textarea){
      return;
    }

    const message =
      String(
        textarea.value || ""
      ).trim();

    if(!message){
      return;
    }


    if(button){
      button.disabled = true;
      button.textContent = "...";
    }

    textarea.disabled = true;


    try{

      await sendMessage(message);

      textarea.value = "";

      lastMessageSignature = "";

      await refreshMessages(true);

    }catch(error){

      alert(
        error.message ||
        "Your message could not be sent."
      );

    }finally{

      textarea.disabled = false;

      if(button){
        button.disabled = false;
        button.textContent = "Send";
      }

      textarea.focus();

    }
  }


  /* =========================================================
     CHAT ENDED
     ========================================================= */

  function updatePanelStatus(
    isActive
  ){

    const status =
      document.getElementById(
        "ab-chat-status"
      );

    const reply =
      document.getElementById(
        "ab-chat-reply"
      );

    const ended =
      document.getElementById(
        "ab-chat-ended"
      );


    if(status){

      status.textContent =
        isActive
          ? "Live conversation"
          : "Live chat ended";

    }


    if(reply){

      reply.style.display =
        isActive
          ? "flex"
          : "none";

    }


    if(ended){

      if(isActive){

        ended.style.display =
          "none";

        ended.innerHTML = "";

      }else{

        ended.style.display =
          "block";

        ended.innerHTML = `
  <div class="ab-chat-ended-title">
    Thanks for chatting with AnyBike.
  </div>

  <div class="ab-chat-ended-copy">
    This live chat has ended.
    Create your free AnyBike account
    to save this conversation and make
    it easier to contact us again.
  </div>

  <a
    class="ab-chat-ended-primary"
    href="/customer-register.html"
  >
    Create Free Account
  </a>

  <a
    class="ab-chat-ended-secondary"
    href="/customer-register.html"
  >
    Already registered? Sign in
  </a>
`;

      }

    }
  }


  /* =========================================================
     STATUS
     ========================================================= */

  async function checkLiveChat(){

    if(requestRunning){
      return;
    }

    requestRunning = true;

    try{

      const ready =
        await initialiseGuest();

      if(!ready){
        return;
      }

      const status =
        await getChatStatus();

      if(!status){
        return;
      }


      currentThreadId =
        status.thread_id || null;

      currentLiveStatus =
        status.live_chat_active === true;


      if(
        currentThreadId &&
        currentLiveStatus
      ){

        if(panelOpen){

          updatePanelStatus(true);

        }else{

          showInvitation(
            currentThreadId
          );

        }

      }else{

        removeInvitation();

        if(panelOpen){

          updatePanelStatus(false);

          await refreshMessages(false);

        }

      }

    }catch(error){

      console.warn(
        "AnyBike Live Chat unavailable",
        error.message || error
      );

    }finally{

      requestRunning = false;

    }
  }


  /* =========================================================
     TIMERS
     ========================================================= */

  function startMessagePolling(){

    stopMessagePolling();

    messageTimer =
      setInterval(
        function(){
          refreshMessages(false);
        },
        MESSAGE_POLL_MS
      );
  }


  function stopMessagePolling(){

    if(messageTimer){

      clearInterval(messageTimer);

      messageTimer = null;
    }
  }


  function start(){

    injectStyles();

    checkLiveChat();

    if(statusTimer){
      clearInterval(statusTimer);
    }

    statusTimer =
      setInterval(
        checkLiveChat,
        STATUS_POLL_MS
      );
  }


  if(
    document.readyState ===
    "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {once:true}
    );

  }else{

    start();

  }

})();