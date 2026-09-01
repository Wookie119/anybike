/*
AnyBike
File: live-chat.js
Version: 2026.09.01-1

Purpose
-------
Standalone public Live Chat invitation.

- Uses the visitor ID created by public-header.js
- Creates/restores a secure guest chat token
- Checks whether AnyBike has started a Live Chat
- Shows an invitation only when live_chat_active = true
- Does not alter public-header.js
*/

(function initialiseAnyBikeLiveChat(){

  const GUEST_CHAT_URL =
    "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/guest-live-chat";

  const VISITOR_KEY = "anybike_visitor_id";
  const TOKEN_KEY = "anybike_guest_chat_token";

  const POLL_MS = 5000;

  let pollTimer = null;
  let requestRunning = false;
  let currentThreadId = null;


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
     API
     ========================================================= */

  async function callGuestChat(payload){

    const response = await fetch(GUEST_CHAT_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    });

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

    const data = await callGuestChat(payload);

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


  /* =========================================================
     INVITATION
     ========================================================= */

  function removeInvitation(){

    const existing =
      document.getElementById(
        "anybike-live-chat-invite"
      );

    if(existing){
      existing.remove();
    }
  }


  function createInvitation(threadId){

    if(
      document.getElementById(
        "anybike-live-chat-invite"
      )
    ){
      return;
    }

    currentThreadId = threadId || null;

    const box = document.createElement("div");

    box.id = "anybike-live-chat-invite";

    box.innerHTML = `
      <button
        type="button"
        id="anybike-live-chat-close"
        aria-label="Close Live Chat invitation"
      >
        ×
      </button>

      <div class="anybike-live-chat-icon">
        💬
      </div>

      <div class="anybike-live-chat-copy">
        <strong>AnyBike Live Chat</strong>

        <p>
          AnyBike is available to chat with you.
          Would you like to open the conversation?
        </p>

        <button
          type="button"
          id="anybike-live-chat-open"
        >
          Open Live Chat
        </button>
      </div>
    `;

    document.body.appendChild(box);

    injectStyles();

    document
      .getElementById("anybike-live-chat-close")
      ?.addEventListener(
        "click",
        function(){
          box.remove();
        }
      );

    document
      .getElementById("anybike-live-chat-open")
      ?.addEventListener(
        "click",
        function(){

          /*
          The next stage will replace this with the
          actual anonymous Live Chat conversation panel.

          For now this confirms the secure invitation
          reaches the correct guest browser.
          */

          const button =
            document.getElementById(
              "anybike-live-chat-open"
            );

          if(button){
            button.textContent =
              "Live Chat Connected";

            button.disabled = true;
          }

          console.log(
            "AnyBike Live Chat opened",
            currentThreadId
          );
        }
      );
  }


  /* =========================================================
     STYLE
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

    style.id = "anybike-live-chat-styles";

    style.textContent = `
      #anybike-live-chat-invite{
        position:fixed;
        right:22px;
        bottom:22px;
        width:min(360px,calc(100vw - 32px));
        box-sizing:border-box;
        z-index:2147483000;

        display:flex;
        gap:13px;

        padding:18px 18px 17px;

        background:#101010;
        color:#ffffff;

        border:1px solid rgba(255,255,255,.13);
        border-radius:16px;

        box-shadow:
          0 18px 55px rgba(0,0,0,.48);

        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }

      #anybike-live-chat-close{
        position:absolute;
        top:7px;
        right:10px;

        width:28px;
        height:28px;

        padding:0;
        border:0;
        background:transparent;

        color:#a8a8a8;

        font-size:23px;
        line-height:28px;

        cursor:pointer;
      }

      #anybike-live-chat-close:hover{
        color:#ffffff;
      }

      .anybike-live-chat-icon{
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

      .anybike-live-chat-copy{
        flex:1;
        min-width:0;
        padding-right:10px;
      }

      .anybike-live-chat-copy strong{
        display:block;

        margin:1px 0 6px;

        color:#ffffff;

        font-size:16px;
        line-height:1.2;
      }

      .anybike-live-chat-copy p{
        margin:0 0 13px;

        color:#d5d5d5;

        font-size:13px;
        line-height:1.45;
      }

      #anybike-live-chat-open{
        display:inline-flex;
        align-items:center;
        justify-content:center;

        min-height:38px;

        padding:9px 16px;

        border:0;
        border-radius:9px;

        background:#ed1c24;
        color:#ffffff;

        font-weight:700;
        font-size:13px;

        cursor:pointer;
      }

      #anybike-live-chat-open:hover{
        filter:brightness(1.08);
      }

      #anybike-live-chat-open:disabled{
        cursor:default;
        opacity:.75;
      }

      @media(max-width:600px){

        #anybike-live-chat-invite{
          left:16px;
          right:16px;
          bottom:16px;

          width:auto;
        }

      }
    `;

    document.head.appendChild(style);
  }


  /* =========================================================
     POLLING
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

      const threadId =
        status.thread_id || null;

      const isActive =
        status.live_chat_active === true;

      if(threadId && isActive){

        createInvitation(threadId);

      }else{

        removeInvitation();

      }

    }catch(error){

      /*
      Keep Live Chat failure isolated from the website.
      It must never interfere with the public header/page.
      */

      console.warn(
        "AnyBike Live Chat unavailable",
        error.message || error
      );

    }finally{

      requestRunning = false;

    }
  }


  function start(){

    checkLiveChat();

    if(pollTimer){
      clearInterval(pollTimer);
    }

    pollTimer =
      setInterval(
        checkLiveChat,
        POLL_MS
      );
  }


  if(document.readyState === "loading"){

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {once:true}
    );

  }else{

    start();

  }

})();