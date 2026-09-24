/* =========================================================
   ANYBIKE LIVE VISITOR + JOURNEY TRACKING
   ========================================================= */

(function initialiseAnyBikeVisitorTracking(){
  if(window.__anybikeVisitorJourneyTrackingStarted){ return; }
  window.__anybikeVisitorJourneyTrackingStarted=true;

  const TRACK_VISITOR_URL =
    "https://tuehtnezhdnkqbbhttgp.supabase.co/functions/v1/track-visitor";

  const HEARTBEAT_MS = 30000;

  let heartbeatTimer = null;
  let lastSendStartedAt = 0;
  const pageViewId = createUuid();
  let accumulatedVisibleMs = 0;
  let visibleStartedAt =
    document.visibilityState === "visible"
      ? Date.now()
      : null;

  function createUuid(){
    if(window.crypto?.randomUUID){
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function(char){
        const random = Math.random() * 16 | 0;
        const value = char === "x"
          ? random
          : (random & 0x3 | 0x8);

        return value.toString(16);
      }
    );
  }

  function getOrCreateVisitorId(){
    const key = "anybike_visitor_id";

    try{
      let value = localStorage.getItem(key);

      if(!value){
        value = createUuid();
        localStorage.setItem(key,value);
      }

      return value;

    }catch(error){
      console.warn("AnyBike visitor ID storage unavailable",error);
      return createUuid();
    }
  }

  function getOrCreateSessionId(){
    const key = "anybike_session_id";

    try{
      let value = sessionStorage.getItem(key);

      if(!value){
        value = createUuid();
        sessionStorage.setItem(key,value);
      }

      return value;

    }catch(error){
      console.warn("AnyBike session ID storage unavailable",error);
      return createUuid();
    }
  }

  function detectDeviceType(){
    const userAgent=String(navigator.userAgent || "");

    if(/tablet|ipad|playbook|silk/i.test(userAgent)){
      return "Tablet";
    }

    if(/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(userAgent)){
      return "Mobile";
    }

    return "Desktop";
  }

  function detectBrowser(){
    const userAgent=String(navigator.userAgent || "");

    if(/Edg\//i.test(userAgent)) return "Edge";
    if(/OPR\//i.test(userAgent)) return "Opera";
    if(/Chrome\//i.test(userAgent)) return "Chrome";
    if(/Firefox\//i.test(userAgent)) return "Firefox";

    if(/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)){
      return "Safari";
    }

    return "Other";
  }

  function getLoggedInUserId(){
    try{
      if(
        typeof anybikeHeaderUser !== "undefined" &&
        anybikeHeaderUser?.id
      ){
        return anybikeHeaderUser.id;
      }
    }catch(error){
      // Header may not have resolved the session yet.
    }

    return null;
  }

  function commitVisibleTime(){
    if(visibleStartedAt !== null){
      accumulatedVisibleMs += Math.max(0,Date.now() - visibleStartedAt);
      visibleStartedAt = null;
    }
  }

  function resumeVisibleTime(){
    if(visibleStartedAt === null && document.visibilityState === "visible"){
      visibleStartedAt = Date.now();
    }
  }

  function activeSeconds(){
    let ms=accumulatedVisibleMs;

    if(visibleStartedAt !== null){
      ms += Math.max(0,Date.now() - visibleStartedAt);
    }

    return Math.max(0,Math.floor(ms / 1000));
  }

  async function sendVisitorHeartbeat(options){
    const settings=options || {};
    const now=Date.now();

    if(!settings.force && now - lastSendStartedAt < 1500){
      return;
    }

    lastSendStartedAt=now;

    const payload={
      visitor_id:getOrCreateVisitorId(),
      session_id:getOrCreateSessionId(),
      page_view_id:pageViewId,
      user_id:getLoggedInUserId(),

      current_path:
        window.location.pathname +
        window.location.search,

      page_title:document.title || "",
      referrer:document.referrer || "",
      language:navigator.language || "",
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      device_type:detectDeviceType(),
      browser:detectBrowser(),
      active_seconds:activeSeconds(),
      page_left:settings.pageLeft === true
    };

    try{
      const response=await fetch(TRACK_VISITOR_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
        keepalive:true
      });

      if(!response.ok){
        const errorText=await response.text().catch(()=>"");
        console.warn(
          "AnyBike visitor tracking request failed",
          response.status,
          errorText
        );
      }

    }catch(error){
      console.warn("AnyBike visitor tracking unavailable",error);
    }
  }

  function startVisitorHeartbeat(){
    resumeVisibleTime();
    sendVisitorHeartbeat({force:true});

    if(heartbeatTimer){
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer=setInterval(function(){
      if(document.visibilityState === "visible"){
        sendVisitorHeartbeat();
      }
    },HEARTBEAT_MS);
  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      startVisitorHeartbeat,
      {once:true}
    );
  }else{
    startVisitorHeartbeat();
  }

  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState === "visible"){
      resumeVisibleTime();
      sendVisitorHeartbeat({force:true});
    }else{
      commitVisibleTime();
      sendVisitorHeartbeat({force:true});
    }
  });

  window.addEventListener("focus",function(){
    resumeVisibleTime();
    sendVisitorHeartbeat();
  });

  window.addEventListener("pagehide",function(){
    commitVisibleTime();
    sendVisitorHeartbeat({force:true,pageLeft:true});
  });

  window.addEventListener("anybikePublicHeaderReady",function(){
    sendVisitorHeartbeat({force:true});
  });

})();
